---
author: Eugene Yakhnenko
pubDatetime: 2026-04-09T12:00:00Z
title: "I Found 5 Security Bugs in My OAuth2 Provider on My First Try (With an MCP Security Tool)"
slug: security-bugs-oauth2-provider-mcp
featured: false
tags:
  - security
  - go
  - oidc
  - ai
  - autentico
description: "How connecting go-appsec/toolbox to Claude Code revealed five vulnerabilities in Autentico, including a HIGH severity unauthenticated token introspection issue, on the very first session."
---

I built [Autentico](https://github.com/eugenioenko/autentico), a self-contained OAuth 2.0 / OpenID Connect identity provider in Go. I took spec compliance seriously. Every code path is annotated with the RFC section it implements, I passed the OpenID Foundation conformance suite, and I ran OWASP ZAP scans against it. I thought I was in good shape.

Then I connected [go-appsec/toolbox](https://github.com/go-appsec/toolbox) to Claude Code, browsed my app for ten minutes, and found five vulnerabilities (including a HIGH severity issue) on my very first session with the tool. I had almost no prior experience with security testing.

Here's how that happened.

## The foundation: RFC annotations and conformance testing

When I built Autentico, I wanted to do things by the book. Every return path, every validation check, every error response references the exact spec section that mandates it:

```go
// RFC 7009 §2.1: "The authorization server first validates the client
// credentials (in case of a confidential client)."
authenticatedClient, err := client.AuthenticateClientFromRequest(r)

// RFC 6749 §10.4: refresh token MUST be bound to the client it was issued to;
// presenting a refresh token issued to a different client MUST be rejected.
if authToken.ClientID != "" && request.ClientID != "" && authToken.ClientID != request.ClientID {

// RFC 7662 §2.2: REQUIRED. Whether the token is currently active.
Active bool `json:"active"`
```

I reviewed 10 RFCs and specs across the OAuth2 and OIDC ecosystem, tracking every MUST, SHOULD, and MAY requirement in compliance tables. I ran the OpenID Foundation conformance suite (`oidcc-basic-certification-test-plan`) and passed. I had unit tests, e2e tests, functional tests, and browser tests.

This gave me confidence in the spec compliance of the implementation. But spec compliance and security are not the same thing.

## Traditional scanning: OWASP ZAP

I ran an OWASP ZAP API scan (both authenticated and unauthenticated) against 169 URLs. The results were useful but shallow:

- Missing OWASP security headers (X-Frame-Options, CSP, Permissions-Policy, etc.)
- A couple of endpoints returning 500 instead of 404 for nonexistent resources

I fixed everything in one PR. Final ZAP results: **0 FAIL, 112 PASS, 4 WARN** (all informational). Clean bill of health from the scanner.

ZAP tests what it can see from the outside: headers, status codes, common injection patterns. It doesn't understand OAuth flows, MFA logic, or token lifecycle. For that, I needed something different.

## Enter go-appsec/toolbox

[go-appsec/toolbox](https://github.com/go-appsec/toolbox) is an MCP (Model Context Protocol) server designed for collaborative security testing between humans and AI agents. It's not a scanner; it's a workbench. The idea is simple:

- **You** handle the browser: log in, navigate the app, trigger the flows you want tested
- **The AI agent** watches the traffic through a proxy, analyzes it, and suggests or executes attacks

The tool provides MCP tools for traffic capture (`proxy_poll`), request replay with modifications (`replay_send`), JWT inspection (`jwt_decode`), cookie analysis (`cookie_jar`), out-of-band testing (`oast_create`), and more. You connect it to Claude Code (or any MCP-compatible client), and the AI agent uses these tools to probe your application while you drive the browser.

### Setup

The setup took minutes:

1. Start the toolbox MCP server with proxy on port 8080
2. Configure the browser to proxy through it
3. Connect the MCP server to Claude Code via `claude mcp add`
4. Browse the application to capture traffic

I captured about 112 proxy flows covering OAuth authorization, token exchange, admin CRUD, account management, and MFA enrollment. Then I asked Claude to start testing.

## What I found: 5 vulnerabilities on my first try

I want to emphasize: this was my first time using the tool. I had no prior pentesting experience and very little knowledge of how to use go-appsec/toolbox effectively. I was learning the workflow as I went. Despite that, the collaboration between the tool and the AI agent produced real, actionable findings.

### The standout: unauthenticated token introspection (HIGH)

The `/oauth2/introspect` endpoint returned full token metadata (active status, scopes, user ID, and claims) without requiring any client credentials. Anyone who had a token value could check whether it was active and extract its claims.

The AI agent found this by using `request_send` to POST to the introspect endpoint with no authorization header. The response came back `200 OK` with `active: true` and full claim data. This is the kind of finding that demonstrates the tool's workflow: it captured the legitimate introspect request during browsing, stripped the credentials, replayed it, and confirmed the server didn't enforce authentication. Fixed within minutes during the same session.

### The other four

The remaining findings were two MEDIUM and two LOW severity issues:

- **PKCE not enforced for public clients.** The agent used `replay_send` on a captured authorize flow with `code_challenge` removed. The server accepted it.
- **Refresh tokens not rotated on use.** The agent hit the token endpoint twice with the same refresh token. Both succeeded.
- **CSRF error leaked internal config.** A POST without the CSRF cookie returned the environment variable name and value in the error message.
- **Stored XSS in client_name** (no exploitable render context). A `<script>` tag was accepted in the admin API, though the output was HTML-encoded.

### What passed (23 tests)

Importantly, the tool also confirmed a lot of things were solid: redirect URI validation (6 bypass variants attempted), JWT `alg:none` confusion, scope escalation, admin authorization enforcement, username enumeration timing, SQL injection, mass assignment, and account lockout logic. All held up.

## What the author found: 10 more issues, deeper logic bugs

After I shared my experience, the toolbox author ran their own session against Autentico. With deeper knowledge of both the tool and security testing methodology, they found five additional vulnerabilities. All logic-level bugs that require understanding how OAuth and MFA flows interact:

### MFA enforcement bypass (#172)

This one is the best example of what AI-assisted testing can find that scanners can't. MFA enforcement had four independent gaps that reinforced each other:

- The password grant issued tokens without any MFA challenge, even when `require_mfa` was enabled
- Pre-MFA sessions weren't invalidated when the policy changed
- An attacker with a bearer token could rotate a user's TOTP secret without presenting a valid OTP code
- MFA could be disabled with just the account password, no TOTP code required

No single gap is obvious in isolation. Finding them requires reasoning about the interaction between authentication flows, token grants, and policy enforcement. A scanner sees endpoints; the AI agent understood the MFA lifecycle.

### Password grant authenticating deactivated users (#174)

The `AuthenticateUser()` function didn't check `deactivated_at`, while every other user lookup in the codebase did. A soft-deleted user could authenticate via the password grant and receive fresh tokens indefinitely. The admin who deleted the user would have no idea. This is a one-line fix (`AND deactivated_at IS NULL`) but finding it requires noticing the inconsistency across query patterns.

### Admin API audience validation bypass (#183)

The admin API only checked that the user had the admin role. Any token belonging to an admin user was accepted regardless of which client issued it. A malicious app registered with the IdP could trick an admin into authorizing it, then replay that token against the admin API for full control. The fix enforces that tokens must also include admin audience in their audience claim, which only tokens issued through the admin client carry by default.

### The other ones:

- **Empty `aud` claim in access tokens (#171).** Tokens had `"aud": []`, and the admin middleware didn't validate `azp`, so a token from any client worked on the admin API.
- **Missing `Cache-Control: no-store` headers (#173).** Sensitive API responses (user lists, settings, sessions) could be cached by browsers and proxies.
- **Blind SSRF in federation discovery (#177).** The HTTP client followed redirects to internal/loopback addresses when fetching federated IdP discovery documents.

## The takeaway

I tested my OAuth2 provider with three approaches:

| Approach                   | What it found                                            | Depth          |
| -------------------------- | -------------------------------------------------------- | -------------- |
| **OIDC Conformance Suite** | Spec compliance gaps                                     | Protocol-level |
| **OWASP ZAP**              | Missing headers, error handling                          | Surface-level  |
| **go-appsec/toolbox + AI** | 10 vulnerabilities including auth bypass, MFA gaps, SSRF | Logic-level    |

The traditional tools did their job. They confirmed my implementation followed the specs and had standard security headers in place. But the logic-level vulnerabilities (the ones that actually matter for an identity provider) only surfaced when an AI agent could reason about how the pieces fit together.

What surprised me most is that I didn't need to be a security expert to get value from this. The MCP collaboration model means the agent brings security testing knowledge and methodology, while you bring the application context (which flows matter, what the admin UI does, how MFA is supposed to work). Together, you cover ground that neither could alone.

Ten minutes of browsing. First time using the tool. Five findings, three fixed on the spot. That's a pretty compelling return on investment for any developer who cares about the security of what they're building.

All 10 findings across both sessions have been fixed and are tracked in the [Autentico Github](https://github.com/eugenioenko/autentico). All thanks to [go-appsec/toolbox Github](https://github.com/go-appsec/toolbox).
