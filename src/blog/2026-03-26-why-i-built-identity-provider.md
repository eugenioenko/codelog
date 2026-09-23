---
author: Eugene Yakhnenko
pubDatetime: 2026-03-26T12:00:00Z
title: "Why I Built an Identity Provider in Go and SQLite"
slug: why-i-built-identity-provider-go-sqlite
featured: false
tags:
  - go
  - sqlite
  - identity
  - oidc
  - autentico
description: "How and why I built Autentico, a self-contained, single-binary OIDC provider backed by SQLite that removes the ceremony from identity management."
---

When I set out to build [Auténtico](https://autentico.top/), my primary goal was to create a fully-featured OpenID Connect Identity Provider where **operational simplicity was the first-class design principle**.

Identity infrastructure is notoriously complex. A typical self-hosted setup involves a database server, a cache tier like Redis, a worker queue, and the identity service itself. When I needed a lightweight OpenID Connect (OIDC) server to run on a small 2GB RAM VPS, I realized the existing landscape was either operationally exhausting or structurally flawed for my specific needs.

This is the story of how (and why) I built **Auténtico**, a self-contained, single-binary OIDC provider backed by SQLite that removes the ceremony from identity management.

---

## The Itch: Finding the Right Lightweight IdP

My journey started because I was researching and implementing a frontend OIDC library for product needs at my company. That scratched an itch, and I evolved it into a functional backend OIDC protocol server in Go.

Months later, when I needed a lightweight Identity Provider, I evaluated the popular options but quickly hit roadblocks:

- **Casdoor:** I didn't like how they treated private data. Their demo instances recycle accounts every 5 minutes, making it impossible to truly test account deletion.
- **PocketId:** This is a fantastic tool, but it had a critical UX flaw for my needs: it is **passkey-only** by default.

While passkeys are the future, the current ecosystem is heavily fragmented. If a user is on an older OS or a restrictive browser, a passkey-only IdP completely locks them out. 

---

## The Antidote: Zero-Ceremony Architecture

I decided to convert my OIDC protocol server into a full IdP, ensuring that every architectural decision was evaluated against a single question: **does this reduce or increase the operational burden on the person running this?**

[Auténtico](https://autentico.top/) removes the entire traditional identity stack:

- **Single Binary:** The entire IdP runs as one Go binary.
- **Embedded SQLite:** There is no separate database server. The entire state lives in one file. Eliminating the external database removes connection pool tuning, credential rotation, and network partitions.
- **No External Infrastructure:** No Redis, no Postgres, no message queues. Background cleanup goroutines automatically purge expired tokens, sessions, and auth codes.
- **Embedded UIs:** Both the Admin dashboard (React/Ant Design) and the user-facing Account UI (React/Tailwind) are compiled directly into the binary using `go:embed`. There are zero separate frontend deployments.

---

## Flexibility Over Dogma: Solving the Passkey Trap

To solve the hardware and OS fragmentation issues I experienced with passkeys, I ensured Auténtico wouldn't trap operators into a single authentication path.

Instead, Auténtico offers **three distinct authentication modes** that are switchable at runtime without restarting the server:

1. `password`
2. `password_and_passkey`
3. `passkey_only`

If you deploy `passkey_only` and discover your users' specific browser combinations are failing, you can instantly flip a setting in the Admin UI to fall back to passwords. For robust security without passkeys, it includes standard fallback methods like **TOTP** (with in-browser QR enrollment) and **Email OTP**. For users with modern browsers, it fully supports hardware-backed **FIDO2** authentication and even allows first-login registration in one seamless flow.

---

## The "Deliberately Un-clever" Architecture & The AI Accelerator

To make this work, the codebase had to be **deliberately un-clever**. I designed a strict vertical-slice architecture where each package (like `pkg/login` or `pkg/token`) owns its exact slice of functionality with a predictable structure:

- `model.go`
- `handler.go`
- `service.go`
- Database CRUD

This strictness had a massive secondary benefit: it created the **perfect environment for AI**. Because I spent the time establishing this blueprint, I reached a tipping point where I could hand off the boilerplate. AI agents seamlessly followed the patterns to generate the CRUD operations and rapidly write over **700 tests** (hitting **80% coverage**) precisely because the architectural constraints were so rigid.

---

## The Scale Ceiling (And Why It Doesn't Matter)

The immediate pushback to this architecture is always: *"SQLite doesn't scale."*

I am intentionally honest about the scale ceiling: SQLite serializes writes. Auténtico is **not** designed for active-active multi-region deployments or massive enterprise horizontal scaling.

However, let's look at the math:

| Concurrency | Error rate | Login p95 | Token p95 | Assessment |
|-------------|------------|-----------|-----------|------------|
| 20 VUs | 0% | 86ms | 54ms | Comfortable — imperceptible to users |
| 100 VUs | 0% | 611ms | 647ms | Supported — fully functional |
| 500 VUs | 0% | 3.36s | 3.89s | Degraded — users feel the wait |

> Performance tests with k6 show the system degrades gracefully via SQLite's busy timeout—queueing requests and adding latency rather than throwing errors.

For most teams running internal tools, small-to-mid-sized apps, or self-hosted environments, **trading infinite horizontal scaling for zero operational overhead is absolutely the right choice**.

---

## Conclusion

Operational simplicity does not mean protocol simplicity.

Auténtico strictly enforces:
- **OIDC Discovery** — publishes `/.well-known/openid-configuration` so relying parties auto-configure without hardcoding endpoints
- **JWK Set** — exposes public signing keys at `/.well-known/jwks.json` for independent token verification
- **RS256 JWT Signing** — asymmetric signing; the private key never leaves the IdP
- **Auth2/OIDC protocol**: Implements OIDC protocol
- **Admin UI**: For admins to manage clients, users and session
- **Account UI**: For users to manage their profile
- **Swagger OpenAPI docs**: Publishes API specs docs 

If you are a small team, an indie developer, or just someone who wants to deploy an Identity Provider without taking on a second job as a sysadmin, sometimes **the best architecture is the one you barely have to think about**.

## Links

- [Auténtico](https://autentico.top/)
- [Github](https://github.com/eugenioenko/autentico)
