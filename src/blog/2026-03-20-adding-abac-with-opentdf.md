---
auth: Eugene Yakhnenko
title: "Adding ABAC Authorization to a Real-Time Collaborative App with OpenTDF"
pubDatetime: 2026-03-19T12:00:00Z
featured: true
slug: adding-abac-to-skedoodle-with-opentdf
tags:
  - typescript
  - abac
  - opentdf
  - authorization
  - real-time-collaboration
  - authz
  - authorization
description: "How I added attribute-based access control to Skedoodle, an open-source real-time collaborative sketching app, using OpenTDF. Covering database-backed sharing, WebSocket enforcement, and centralized ABAC policy decisions, all built in a single afternoon with an AI coding agent."
---
I built [Skedoodle](https://github.com/eugenioenko/skedoodle), an open-source real-time collaborative sketching app. Think a lightweight Figma for doodling: multiple users connect over WebSocket, draw on a shared infinite canvas, and see each other's cursors move in real time. It's built with React, TypeScript, Two.js for vector graphics, and Zustand for state management, with an Express backend handling persistence and real-time sync.

Building the interactive parts was the fun challenge. Throttled rendering at 60fps, path simplification algorithms to keep stroke data lean, touch support, pan and zoom on an infinite canvas, undo/redo that works across multiple collaborators. Skedoodle is a proper interactive app, not a toy demo.

But it had a glaring gap: **no authorization**. Authentication? Sure, users logged in via OIDC. But once you were in, you could access any sketch if you knew the ID. Think YouTube: every video is technically accessible if you have the link, even "unlisted" ones. Skedoodle had the same problem. There was no way to control who could see or edit what.

I needed to fix this. And I wanted to do it with a system that could scale beyond simple ownership checks. Something that could handle teams, departments, classification levels, or cross-organization sharing down the road without rewriting everything. That's exactly what attribute-based access control (ABAC) is designed for.

## Why OpenTDF

I looked at several options for adding authorization, from hand-rolling role checks to integrating a dedicated policy engine. I landed on [OpenTDF](https://opentdf.io/), an open-source platform maintained by [Virtru](https://www.virtru.com/) that provides attribute-based access control (ABAC) alongside end-to-end encryption via the [Trusted Data Format](https://github.com/opentdf/spec) specification.

What drew me in was how **lightweight the authorization integration is**. OpenTDF is known for its encryption capabilities, but the ABAC engine stands entirely on its own. You don't need to encrypt anything to use it. You define policies, and the platform makes access decisions. That's exactly what I needed: a centralized policy engine that could answer "does this user have access to this sketch?" based on attributes rather than hardcoded role checks.

The ABAC model is straightforward:

1. You define **namespaces** and **attributes** (e.g., `https://skedoodle.com/attr/sketch-access`)
2. Each attribute has **values** and a **rule** (AnyOf, AllOf, or Hierarchy)
3. **Subject mappings** connect identity provider claims to attribute entitlements
4. When someone requests access, the platform evaluates their entitlements against the resource's required attributes and returns **permit or deny**

No SDKs to embed, no agents to deploy. It's a JSON API you call. Your app manages the data, OpenTDF manages the policy.

## The Access Model

What I wanted was straightforward:

- **Owner** creates a sketch and always has full access
- **Owner can invite** other users by username
- **Owner can remove** any collaborator
- **Collaborators** can draw on the sketch and can leave voluntarily
- **Collaborators cannot** remove other collaborators or the owner
- **Public sketches** are viewable (read-only) by anyone logged in

Simple enough for users to understand, but it needs proper enforcement at every layer: REST API, WebSocket connections, and the real-time command stream.

## Building It with an AI Agent

Here's where the experiment gets interesting. I used Claude Code as my AI coding agent and fed it the OpenTDF documentation via `llms.txt`, a structured context file maintained for the project. I wanted to see: could an agent understand the ABAC model from documentation alone and build a correct integration?

The answer was yes. The agent:

- Read the OpenTDF docs and **correctly chose ABAC authorization over full TDF encryption**, understanding that per-command encryption would be impractical for real-time collaboration
- Designed an attribute scheme (one attribute value per sketch, AnyOf rule) that maps cleanly to the sharing model
- Built the entire integration: database schema, REST API, WebSocket authorization, OpenTDF service with subject mapping lifecycle, and client UI

The architecture was right from the start. I pointed the agent at the docs, described the access model I wanted, and it delivered a working integration. There were a couple of minor hiccups along the way, like a deprecated action enum format in the docs and entity identifier fields, but nothing that took more than a few minutes to sort out.

## How the Integration Works

### Layer 1: Database-Backed Sharing

A `SketchCollaborator` table tracks who has access to what:

```prisma
model SketchCollaborator {
  id               String   @id @default(cuid())
  sketchId         String
  userId           String
  role             String   @default("collaborator") // "owner" or "collaborator"
  subjectMappingId String?  // OpenTDF subject mapping ID for ABAC cleanup
  sketch           Sketch   @relation(...)
  user             User     @relation(...)
  @@unique([sketchId, userId])
}
```

Three endpoints handle the sharing workflow:

```plaintext
POST   /api/sketches/:id/collaborators      Owner invites by username
DELETE /api/sketches/:id/collaborators/:uid  Owner removes, or user leaves
GET    /api/sketches/:id/collaborators       List who has access
```

Every access check (REST API, WebSocket join, command submission) queries this table first. It's fast, always available, and handles the common case.

### Layer 2: WebSocket Enforcement

Real-time collaboration makes authorization tricky. You can't call a policy service on every brush stroke. The solution:

1. **Authorize on join**: when a user connects, check their role in the database, then verify access through OpenTDF's `GetDecisions` API
2. **Enforce at the room level**: viewers can observe but not send commands
3. **Kick on revocation**: when access is removed via the API, immediately disconnect the user and clean up the subject mapping

```typescript
// When an owner removes a collaborator
await opentdfService.deleteSubjectMapping(targetCollab.subjectMappingId);
opentdfService.invalidateAccessCache(targetCollab.user.username, sketchId);

const room = rooms.get(sketchId);
if (room) {
  room.kickClient(targetUserId); // Sends 'access-revoked', closes socket
}
```

The client handles this gracefully with a dialog explaining what happened and options to retry or go home.

### Layer 3: OpenTDF ABAC Policy

This is where OpenTDF adds value beyond what the database alone provides. On server startup, the service registers Skedoodle's policy structure:

```yaml
Namespace: https://skedoodle.com
Attribute: sketch-access (rule: AnyOf)
```

Each sketch gets its own attribute value. But unlike a static policy, the subject mappings are **actively managed** as part of the application lifecycle:

- **Sketch created**: register an attribute value for the sketch, create a subject mapping for the owner
- **Collaborator invited**: create a subject mapping linking the user's Keycloak username to the sketch's attribute value
- **Collaborator removed**: delete the subject mapping, invalidate the decision cache
- **WebSocket join**: call `GetDecisions` to verify the user has a valid entitlement

Here's how a subject mapping is created when a user is invited:

```typescript
const result = await rpc(
  "policy.subjectmapping.SubjectMappingService",
  "CreateSubjectMapping",
  {
    attributeValueId: valueId,
    actions: [{ name: "read" }],
    newSubjectConditionSet: {
      subjectSets: [
        {
          conditionGroups: [
            {
              booleanOperator: "CONDITION_BOOLEAN_TYPE_ENUM_OR",
              conditions: [
                {
                  subjectExternalSelectorValue: ".username",
                  operator: "SUBJECT_MAPPING_OPERATOR_ENUM_IN",
                  subjectExternalValues: [username],
                },
              ],
            },
          ],
        },
      ],
    },
  }
);
```

This tells the platform: when a user's Keycloak `.username` matches, grant them the sketch's attribute value entitlement.

And here's the access check on WebSocket join:

```typescript
const result = await rpc("authorization.AuthorizationService", "GetDecisions", {
  decisionRequests: [
    {
      actions: [{ name: "read" }],
      entityChains: [
        {
          id: "user",
          entities: [{ userName: username }],
        },
      ],
      resourceAttributes: [
        {
          attributeValueFqns: [
            `https://skedoodle.com/attr/sketch-access/value/${sketchId}`,
          ],
        },
      ],
    },
  ],
});
const allowed = result.decisionResponses?.[0]?.decision === "DECISION_PERMIT";
```

Decisions are cached for 30 seconds to avoid latency on repeated operations. The design is **dual enforcement**: the database check determines the user's role, and OpenTDF verifies they have a valid policy entitlement. If the platform is unreachable, the app falls back gracefully to the database check alone.

## Why This Architecture Matters

You might ask: if the database check works, why add OpenTDF at all?

Because **access control requirements grow**. Today it's owner-and-collaborators. Tomorrow it might be:

- "Marketing team members can view all sketches tagged as brand assets"
- "External contractors can only access sketches in their project namespace"
- "Sketches classified as confidential require manager-level clearance"
- "Revoke access to all resources when someone leaves the organization"

With ABAC, these are **policy changes, not code changes**. You define new attributes, create subject mappings that connect identity provider claims to entitlements, and the authorization engine handles the rest. Your application code doesn't change. It still calls `checkAccess()` the same way.

OpenTDF also gives you a centralized view of who can access what across your entire system, instead of scattering access rules across database tables in different services.

## The Timeline

The entire integration took **one afternoon**:

| Phase                                                | Time   |
| ---------------------------------------------------- | ------ |
| Switch identity provider to Keycloak                 | 15 min |
| Create Keycloak client + test users                  | 10 min |
| Database schema + collaborator API                   | 15 min |
| WebSocket authorization + kick-on-revoke             | 15 min |
| Client UI (share dialog, access denied, role badges) | 20 min |
| OpenTDF ABAC service integration                     | 15 min |
| Debugging and polish                                 | 20 min |

The OpenTDF integration itself (registering the namespace, creating attributes, managing subject mappings, wiring up `GetDecisions`) was the smallest piece. Most of the work was building the sharing UX and enforcing access at the WebSocket layer. OpenTDF slotted in cleanly because it's designed to be an authorization service you call, not a framework you restructure your app around.

## Key Takeaways

**ABAC layers on top of what you have.** You don't need to rip out existing access control. Start with your database-backed checks, add OpenTDF as the policy layer, and migrate decision-making to ABAC as your requirements grow.

**The integration surface is small.** Six API calls covered everything: create namespace, create attribute, create attribute value, create subject mapping, delete subject mapping, and get decisions. OpenTDF's Connect RPC API is straightforward to call from any language with plain `fetch`.

**Real-time apps need a caching strategy.** You can't hit an authorization service on every WebSocket message. Authorize on connect, cache decisions with a short TTL, and handle revocation proactively.

**ABAC scales where RBAC doesn't.** Roles are fine until you need to express "users in department X with clearance level Y can access resources tagged with classification Z." That sentence maps directly to ABAC attributes. Trying to model it with roles leads to an explosion of role combinations.

## Try It

The [OpenTDF](https://opentdf.io/) integration lives in a dedicated fork: [skedoodle-opentdf](https://github.com/eugenioenko/skedoodle-opentdf). It includes everything you need to run the full stack locally.

If you're building an app that needs access control beyond basic ownership, especially if you need centralized policy management, auditability, or the flexibility to evolve your authorization model without rewriting code, ABAC with [OpenTDF](https://opentdf.io/) is worth a look.
