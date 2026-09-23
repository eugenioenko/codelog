---
author: Eugene Yakhnenko
pubDatetime: 2026-04-28T12:00:00Z
title: "What 200 Concurrent Users Taught Me About SQLite Performance"
slug: what-200-concurrent-users-taught-me-about-sqlite-performance
featured: false
tags:
  - go
  - sqlite
  - performance
  - autentico
description: "How profiling on the wrong machine led me down a week-long detour, and how WAL mode and a read/write pool split more than doubled throughput in Autentico."
---

I was about to release [Autentico](http://autentico.top/) 2.0. The feature work was done, tests were passing, docs were updated. Before tagging the release I figured I'd spend some time on performance. Run some stress tests, see where things stand, maybe squeeze out some easy wins. What followed was a week-long detour through profiling, architecture design, benchmarking, and a humbling lesson about assumptions.

Autentico is a self-contained OAuth 2.0 / OpenID Connect identity provider built with Go and SQLite. One binary, one database file, no external dependencies. The benchmark workload is a full PKCE authorization code flow: authorize, login with password, token exchange, token introspection, and refresh. Five HTTP requests per iteration, four or five SQLite writes per iteration, and one bcrypt password verification.

## Profiling on the Wrong Machine

I started with k6 stress tests on my older i5 laptop. 100 virtual users, 30 seconds, the full auth flow. The results were fine but not great. So I profiled.

90% of CPU time was spent in `bcrypt.CompareHashAndPassword`.

That's the function that verifies a user's password against the stored hash. It's intentionally slow (that's the point of bcrypt), it's CPU-bound, and it was dominating everything else. SQLite writes took microseconds. JWT signing was negligible. HTTP routing was invisible. Just bcrypt, eating all available cores.

The conclusion seemed obvious: bcrypt is the bottleneck, and you can't make bcrypt faster. You can only do more of it in parallel. But on a single machine running SQLite, you can't just add more instances. SQLite is single-writer, single-file. You can't horizontally scale the traditional way.

Or can you?

## Designing Verifico

The bottleneck wasn't the database. It was one function call. So what if you scaled just that function?

I explored the options systematically:

**CQRS with SQLite replication.** LiteFS can replicate SQLite across nodes, one primary for writes, replicas for reads. A real architecture, but it solves a general scaling problem. Mine was specific. I didn't need to distribute reads and writes. I needed to distribute bcrypt.

**Postgres.** The standard answer for outgrowing SQLite. But Postgres doesn't solve bcrypt CPU. You'd still run `CompareHashAndPassword` on the application server. Multiple instances behind a load balancer would spread the load, but you'd be paying for full application instances (database connections, memory, middleware) when all you need is more CPU for one function.

**Child processes.** Spawn separate processes for bcrypt work. But Go already parallelizes CPU-bound work across all cores via goroutines and the runtime scheduler. On a single machine, you can't beat Go's built-in parallelism. Separate processes just add IPC overhead.

**Sticky sessions.** Route users to specific instances. But you need a shared lookup table, which needs a shared database, which is the problem you're trying to avoid.

Then the idea clicked: keep Autentico as a single instance, owning the database and handling everything. But when it needs to verify a password, send the hash and the plaintext to a remote worker. The worker runs bcrypt and returns true or false. Workers are stateless, trivial, and can run on the cheapest hardware available.

I called it Verifico ("I verify" in Italian, matching Autentico's naming). Same binary, new subcommand: `autentico verifico start`. One HTTP endpoint, one function call, a shared secret for auth, and round-robin load balancing with automatic fallback to local bcrypt if workers are down.

The security model went through its own journey. I started at mTLS (operationally heavy for a boolean endpoint), worked through AES encryption (reimplementing TLS poorly), landed on a shared secret over a private network. The password already traveled over the public internet to reach Autentico. One more hop inside a VPC is no worse.

## It Worked

On the i5, Verifico delivered real improvements. With the server constrained to 2 cores and workers handling bcrypt, non-login endpoints dropped from seconds to single-digit milliseconds. The server's cores were free for HTTP handling, SQLite queries, and JWT signing. Throughput scaled linearly with worker count, up to about 6 cores. At 8 it flattened out.

I was pleased. Built a clean solution, benchmarked it, it worked. Ready to ship.

## It Didn't Work

Then I ran the same benchmarks on a modern Ryzen 7 desktop. 16 cores, faster single-thread performance, more cache.

I constrained Autentico to 2 cores and started adding 2-core workers: 2+2, 2+2+2, all the way up to 2+7x2. On the i5, throughput had kept climbing with each worker up to 6 cores. On the Ryzen:

| Config               | iter/s | Login p95 |
| -------------------- | ------ | --------- |
| 2 server + 2 worker  | 15.4/s | 3.61s     |
| 2 server + 4 worker  | 15.4/s | 3.68s     |
| 2 server + 6 worker  | 15.2/s | 3.58s     |
| 2 server + 10 worker | 15.0/s | 3.60s     |
| 2 server + 14 worker | 14.7/s | 3.76s     |

Flat. Five configurations, 2 to 14 worker cores, and throughput barely moved. Adding workers did nothing.

The Ryzen was simply faster at bcrypt. Even at the default cost of 10, each core chewed through password hashes fast enough that bcrypt stopped being the bottleneck. The real contention was elsewhere entirely.

I had spent days designing, implementing, and benchmarking a solution for a bottleneck that was hardware-specific.

## Finding the Real Bottleneck

I went back to profiling, this time on the Ryzen. A Go block profile under load revealed that every contention point was at `database/sql.(*DB).conn`. Goroutines waiting for a connection from the pool. Not SQLite's file lock, not disk I/O. The Go connection pool.

Reads accounted for 65% of total contention, writes 35%. The top offenders were all routine operations: looking up a client by ID, creating a session, creating a token. Fast queries, stuck waiting in line.

## The Boring Win: WAL Mode

SQLite's default rollback journal locks the entire database during writes, blocking all readers. WAL (Write-Ahead Logging) changes this: readers see a consistent snapshot while writes go to a separate log. The change is one line:

```sql
PRAGMA journal_mode = WAL;
```

It's persistent. Set it once and every future connection inherits it. No application code changes.

Results at 200 virtual users, 30 seconds:

| Cores | Without WAL | With WAL    | Improvement |
| ----- | ----------- | ----------- | ----------- |
| 1     | 13.4 iter/s | 16.7 iter/s | +25%        |
| 2     | 23.6 iter/s | 31.3 iter/s | +33%        |
| 4     | 32.2 iter/s | 49.8 iter/s | +55%        |
| 6     | 33.0 iter/s | 54.3 iter/s | +65%        |
| 8     | 31.9 iter/s | 50.2 iter/s | +57%        |

One pragma. No code changes. Up to 65% throughput improvement. But WAL alone hits a ceiling around 6 cores and actually regresses past that.

## The Real Scaling Win: Read/Write Pool Split

WAL allows concurrent readers alongside a single writer. The natural next step: give readers their own connection pool.

I split the single `*sql.DB` into two pools. A write pool with one connection (serializing all mutations, eliminating SQLITE_BUSY errors) and a read pool with multiple connections for concurrent SELECT queries.

The key was making this invisible to callers. Instead of updating every file that touches the database, I wrote a `DB` wrapper that routes by method: `Exec` and `Begin` go to the writer, `Query` and `QueryRow` go to the reader pool. Every package just calls `db.GetDB()` and the routing happens automatically. Zero changes to business logic.

```go
type DB struct {
    writer *sql.DB
    reader *sql.DB
}

func (d *DB) Exec(query string, args ...any) (sql.Result, error) {
    return d.writer.Exec(query, args...)
}

func (d *DB) Query(query string, args ...any) (*sql.Rows, error) {
    return d.reader.Query(query, args...)
}
```

This also required some iteration. The first attempt was slower due to a bug where pooled connections weren't getting their PRAGMA settings. Once fixed:

| Cores     | WAL Only    | WAL + Pool Split | Improvement |
| --------- | ----------- | ---------------- | ----------- |
| 4         | 49.8 iter/s | 57.0 iter/s      | +14%        |
| 6         | 54.3 iter/s | 76.1 iter/s      | +40%        |
| 8         | 50.2 iter/s | 88.3 iter/s      | +76%        |
| unlimited | 45.9 iter/s | 101.4 iter/s     | +121%       |

Where WAL alone plateaus and regresses, the pool split keeps scaling. At 500 virtual users over 60 seconds, the pool split delivered 3.5x the throughput of the main branch with 59-78% latency reduction across all endpoints. Zero errors on both configurations.

The read pool sweet spot was 4 connections. More than that floods the writer with contention when all those concurrent reads finish simultaneously and try to write. The auto-calculation `min(available CPUs, 4)` with a floor of 2 covers most cases.

## What Shipped in 2.0

Two changes made it into the release:

**WAL mode**, enabled by default. Free performance for every deployment.

**Read/write connection pool split**, transparent to users. The server auto-tunes the read pool size based on available CPUs.

Verifico didn't ship. The benchmarks on the Ryzen showed it wasn't solving a real bottleneck, so there was no reason to add the complexity. The code is there if the need ever materializes on constrained hardware, but for now it's a solution waiting for a problem.

## What I Learned

**Profiling tells the truth, but only about the machine you're sitting at.** I should have known better. In my early years I spent time writing x86 assembly with FASM, where you learn that certain instructions cost more clock cycles than others and that two CPUs at the same clock speed can have very different real-world performance thanks to pipeline optimizations, L1/L2/L3 cache differences, and branch prediction. I knew hardware isn't uniform. What I didn't expect was that the _scaling behavior_ would change. I assumed that if adding worker cores improved throughput on one machine, it would improve throughput on another, maybe at different absolute numbers but with the same shape. Instead, the Ryzen's faster per-core bcrypt performance shifted the bottleneck entirely. The curve wasn't the same shape at a different scale. It was a different curve.

**The boring fix usually wins.** WAL mode is in the SQLite documentation. Connection pooling is a well-understood pattern. Together they more than doubled throughput. Neither required novel architecture.

**Build the optimization, then question it.** I don't regret building Verifico. The design process (working through CQRS, Postgres, gRPC, mTLS, landing on the simplest thing) was valuable, and it works for its intended use case. But I should have validated the assumption on more than one machine before committing to it.

**Don't benchmark at low concurrency and call it done.** Some of the intermediate results at 100 virtual users looked promising for approaches that fell apart at 200. Always test at your target load.
