---
author: Eugene Yakhnenko
pubDatetime: 2026-05-03T12:00:00Z
title: "Making OAuth Testable: Rethinking OIDC Clients in JavaScript"
slug: making-oauth-testable-rethinking-oidc-clients
featured: false
tags:
  - javascript
  - security
  - testing
  - oidc
description: "How separating protocol logic from runtime concerns makes OAuth testable without mocks, using a functional core and thin framework adapters tested against a real identity provider."
---

## The real pain point

Most OAuth/OIDC integrations in JavaScript are difficult to test in a meaningful way. Testing usually involves mocking network calls, faking redirects, stubbing token responses, and simulating browser state. The result is that you are not testing OAuth. You are testing your mocks.

The typical test for an OIDC login flow looks something like this: intercept the fetch call to the token endpoint, return a hardcoded JSON response, check that the UI updated. You have verified that your code handles a specific shape of data. You have not verified that your code actually implements the OIDC protocol correctly.

This is not a minor distinction. OAuth and OIDC are security protocols. The value of testing them comes from exercising the real behavior: actual redirects, actual token exchanges, actual state validation. When every external interaction is replaced with a stub, the test becomes a tautology.

The problem is not OAuth itself. It is how we structure clients.

## Why OIDC clients are hard to test

Most OIDC libraries combine several concerns into a single abstraction:

- **Protocol logic**: PKCE code challenges, state parameters, nonce validation, token parsing
- **HTTP**: fetch calls, interceptors, retry logic
- **Storage**: localStorage, sessionStorage, cookies
- **Framework concerns**: React hooks, Angular services, Vue composables

This creates implicit behavior. A single `useAuth()` hook might trigger discovery, check for stored tokens, initiate a background refresh, and update reactive state, all before the component finishes mounting. None of these steps are visible to the caller.

It also creates tight coupling to the runtime. You cannot test the protocol logic without also dealing with fetch, the DOM, and framework-specific rendering. And so the instinct is to mock everything. Replace fetch with a spy. Stub sessionStorage. Fake the redirect.

When everything is coupled, everything has to be mocked. And when everything is mocked, you are testing a simulation, not the thing itself.

## A different approach: treat OIDC as a protocol

OIDC does not need to be a runtime-driven client. If you look at what the protocol actually requires, most of it is pure computation: building requests, validating callbacks, parsing tokens, and checking expiration. All of these take data in and return data out. They do not need fetch. They do not need localStorage. They do not need a DOM.

The protocol is pure. IO is not. The mistake most libraries make is treating these as one thing.

## Architecture shift: separate protocol from runtime

The idea is straightforward: split the OIDC client into two layers.

The first layer is a **functional core**. It contains every piece of protocol logic, and nothing else. No fetch calls. No storage access. No global state. No framework imports. Every function takes explicit parameters and returns a result. A function like `buildTokenRequest` takes a discovery document, a code, and a code verifier, and returns an object with a URL, headers, and body. It does not send the request. That is someone else's job.

The second layer is a set of **adapters**. Each adapter is framework-specific and handles the IO that the core deliberately avoids. A React adapter composes core functions with fetch and React state. An Angular adapter uses HttpClient and services. A Vue adapter uses composables. A Svelte adapter uses stores.

The adapters are thin. They call core functions to build requests, execute those requests using whatever HTTP mechanism the framework provides, and pass responses back through core functions for parsing and validation.

The result:

- Protocol logic has zero dependencies, not even on fetch. It uses only the Web Crypto API for PKCE generation.
- No framework concerns leak into the core. React does not exist in the token parsing code.
- No hidden side effects. Every IO operation is explicit and visible in the adapter layer.
- Testing boundaries are clear. You can test the core with pure unit tests. You can test the adapters with integration tests. Neither requires mocking the other.

## Testing OAuth without mocks

This is where the architecture pays off. Because the core is pure, you can test it exhaustively with straightforward unit tests. Pass in a discovery document. Get back an authorization URL. Verify the parameters. No HTTP server needed. No browser needed. No mocks needed.

But unit testing the core is only half the story. The real value comes from what this architecture enables at the integration level: testing the full OIDC flow against a real identity provider.

The test setup uses Autentico, a lightweight OIDC provider built for testing. Autentico is a single binary with no external dependencies. In CI, the full setup takes roughly 500 milliseconds: generate cryptographic secrets, create an admin user, register a client, start the server. That is fast enough to spin up a fresh identity provider instance for every individual test.

The goal is not to test Autentico. It is to remove the need for mocks entirely by making the provider disposable.

Each test gets its own Autentico instance with its own database, its own users, and its own registered clients. There is no shared state between tests. No leftover sessions. No token caches that bleed across test boundaries. If a test fails, it fails because of the code under test, not because a previous test left the identity provider in an unexpected state.

The fixture handles everything programmatically:

- Generates random cryptographic secrets (access token, refresh token, CSRF, RSA signing key)
- Creates a fresh SQLite database
- Runs the onboarding step to set up an admin user
- Starts the server on an isolated port
- Registers an OAuth client with the correct redirect URIs
- Creates a test user with known credentials
- Waits for the health check endpoint to respond
- Tears everything down after the test completes

No manual configuration. No shared test environment. No Docker containers. Just a binary that starts in under a second.

## Deterministic end-to-end tests

With a real identity provider running per test, the end-to-end tests exercise the actual protocol flow through a real browser.

Using Playwright, each test performs the full sequence: navigate to the application, click login, get redirected to the identity provider, fill in credentials, submit, get redirected back with an authorization code, exchange the code for tokens, fetch user info, and verify the UI reflects the authenticated state.

Nothing is intercepted. Nothing is stubbed. The browser makes real HTTP requests. The identity provider issues real tokens signed with a real RSA key. The application parses real JWT claims and validates real nonces.

The tests assert both UI state and the exact protocol sequence. A traffic tracker records every fetch request and browser navigation to the identity provider in the order they occur, filtered to OIDC-relevant paths. After each test, assertions verify not just that the login succeeded, but that the exact expected sequence happened in order:

```http
GET  /.well-known/openid-configuration   # app loads, fetches discovery
NAV  /oauth2/authorize                    # browser redirects to IdP
GET  /.well-known/openid-configuration   # app reloads after callback, fetches discovery again
POST /oauth2/token                        # exchanges authorization code for tokens
GET  /oauth2/userinfo                     # fetches user profile
```

The two discovery calls are not a bug. There is a full page navigation between them. The first happens when the app mounts. The browser then navigates to the authorization endpoint. After the user authenticates, the IdP redirects back, the app reloads from scratch, and discovery is fetched again before the token exchange. The sequence tracker makes this visible. An earlier version of the test suite tracked fetches and navigations separately, which made it look like both discoveries happened together. The combined sequence revealed the actual interleaving.

Most tests assert outcomes. These tests also assert the protocol itself. A token refresh that should not have happened. A missing userinfo request. A navigation that fired before a fetch it was supposed to follow. These are the kinds of issues that mock-based tests cannot detect, because the mocks only respond to the calls you anticipated.

The tests also verify security properties:

- Tokens are never stored in localStorage or sessionStorage
- Callback URL parameters (code, state) are cleaned up after processing
- Sessions are not preserved across page reloads (in-memory only)
- The back button after logout does not expose authenticated content
- Tampered state parameters trigger the correct error

Each of these tests runs against the real flow. The assertion that tokens are not in storage is meaningful because real tokens were actually issued and processed. The assertion about state mismatch is meaningful because a real authorization request was initiated with a real state parameter.

## Running tests across frameworks

Because the core is framework-agnostic and each adapter is a thin wrapper, the same test suite runs against every framework. The same spec file tests React, Angular, Vue, Svelte, Lit, Solid, and Preact. Each framework gets its own dev server on an isolated port, its own Autentico instance on a separate port, and its own database.

A shell script orchestrates the runs with configurable parallelism. Locally, with all eight frameworks running in parallel, the full suite completes in under a minute. In CI, they run sequentially to stay within resource limits.

The test names are prefixed with the framework identifier, so failures are immediately attributable:

```plaintext
[React] OIDC Login Flow > completes full login flow with tokens
[Angular] RequireAuth > auto-refreshes expired token when navigating to protected page
[Vue] Security > tokens are not stored in localStorage or sessionStorage
```

This setup catches framework-specific regressions. A change to the Svelte adapter that accidentally double-fires a discovery request will fail the traffic assertion even though the UI behavior looks correct.

## What this catches that mocks don't

One concrete example: token refresh race conditions.

The test for automatic token refresh works like this. First, complete a full login. Then, override `Date.now` in the browser to simulate time passing beyond the token's expiration. Then navigate to a protected page. The RequireAuth guard should detect the expired token, attempt a refresh, and let the user through if the refresh succeeds.

The tricky part is restoring the clock. Restoring `Date.now` from Playwright's `page.evaluate` after the refresh arrives as a macrotask, but the framework's state update from the refresh response runs in the microtask chain. The component re-renders with the new token while `Date.now` still returns the fake expired time, triggering another refresh.

The solution is to patch `window.fetch` alongside `Date.now`, and restore the real clock from inside the fetch promise chain, before the framework processes the response.

This is not a hypothetical edge case. It is a real bug that surfaced during development. A mock-based test would never catch it because the mock controls both the clock and the response, and there is no actual async flow to create the race condition.

Another example: the test that revokes a refresh token server-side, then navigates to a protected page. The guard attempts a refresh, gets a failure from the real identity provider, and falls back to a full login redirect. With mocks, you would return a 400 from a stubbed endpoint. With a real provider, the revocation is real, the failure is real, and the redirect is real. If the client's error handling has a subtle bug in how it interprets the provider's error response, the real test catches it. The mock never will, because the mock returns exactly the error format you expected.

## Tradeoffs

This approach is not free. There are real costs.

Running a real identity provider adds setup complexity. The test fixture is more involved than a simple `beforeEach` that sets up mocks. The Autentico binary needs to be downloaded, and each test pays the cost of starting a server process.

A single test provider gives you deterministic behavior, but it does not cover provider-specific quirks. Real-world OIDC providers have subtle differences in token formats, claim structures, and error responses. Testing against Autentico validates the protocol, not every provider's interpretation of it.

The tests are slower than pure unit tests. A full E2E test with browser automation, server startup, and real HTTP exchanges takes seconds, not milliseconds. The per-test Autentico instance adds roughly 500 milliseconds of overhead. For a single test, that is noticeable. Across a full suite with parallelism, it is manageable.

This is not the fastest way to test auth. It is the most reliable. When the suite passes, you know that the full OIDC flow works in a real browser against a real provider. When it fails, the failure points to an actual problem, not a gap between your mocks and reality.

## Takeaway

OAuth is not inherently hard to test. It becomes hard when protocol logic, IO, and framework concerns are mixed into one abstraction. When they are separated, each piece becomes testable on its own terms.

The protocol layer is pure computation. Test it with inputs and outputs. The adapter layer is framework-specific IO. Test it against a real provider. The identity provider setup is fast enough to be disposable. Give each test a fresh instance and eliminate shared state entirely.

When the suite passes, you are not trusting mocks. You are verifying the protocol itself.

This approach is implemented in [oidc-js](https://github.com/eugenioenko/oidc-js), a zero-dependency, cross-framework OIDC client built around a functional core and thin adapters, tested end-to-end with [Autentico](https://github.com/eugenioenko/autentico), a lightweight OIDC provider built for exactly this kind of workflow.
