---
author: Eugene Yakhnenko
pubDatetime: 2025-04-04
title: Who let the workers out?
slug: persistent-service-workers
featured: false
tags:
  - javascript
  - service workers
description: Who, who, who, who, who?
---

# Who let the workers out, who, who who who?

> A surprisingly persistent issue. Popups appearing even after a browser restart—can sometimes be traced back to an unlikely culprit: service workers.

Recently, a friend mentioned a family member was dealing with rogue popups in the browser. No shady extensions, no hijacked homepage, just weird windows showing up after clicks. The twist? Restarting the browser didn’t fix it. 😱

Turns out, registered **service workers** can survive restarts and, under certain conditions, pop up those windows.

## 🛠️ The Mechanics Behind the Madness

To understand how service workers can exhibit such behavior, we need to look at their lifecycle and interaction model. Service workers are event-driven JavaScript workers designed for offline experiences and background tasks. But like a persistent dog with a bone, they can linger in ways you might not expect. Lets look at some of this cases.

### 🔄 Event-Driven Activation

Service workers don’t just _run_ forever. They wake up in response to specific events:

- **Push Notifications** (server-initiated, requires user permission)
- **Background Sync** (e.g., retrying failed requests)
- **Periodic Sync** (scheduled tasks — browser support varies)

But they can’t just _do stuff_ on their own, especially not pop up windows. Browsers are strict: popups **must** follow direct user interactions.

### 👇 In PopUp world, click is king

Popups need an explicit gesture like:

- Clicking a notification
- Interacting with an open app window

## 🔔 Push Notification Workflow

Here's a minimal service worker example that uses notifications to reopen a window after a browser restart:

```js
// sw.js
self.addEventListener("push", event => {
  const payload = event.data?.json();
  event.waitUntil(
    self.registration.showNotification("New Alert", {
      body: payload.message,
      data: { url: "/alert" },
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(clientsArr => {
      const client = clientsArr.find(c => c.url.includes("/alert"));
      return client
        ? client.focus()
        : clients.openWindow(event.notification.data.url);
    })
  );
});
```

### Key Points:

- The service worker is re-activated by the push.
- `event.waitUntil()` keeps it alive while it handles the async operation.
- The user click on the notification is what allows the popup.

## Keep it Alive! (Zombie Worker)

You can also maintain short-lived communication using messages:

```js
// main.js
navigator.serviceWorker.controller.postMessage({ keepAlive: true });

// sw.js
self.addEventListener("message", event => {
  if (event.data?.keepAlive) {
    // Do background stuff (temporarily)
  }
});
```

⚠️ But note: once all tabs are closed, these channels vanish. And browsers shut down idle service workers after ~30 seconds.

🌍 Browser Behavior Matrix
| Technique | Activation Time | Requires User Interaction? |
|------------------------|------------------------|-----------------------------|
| Push Notifications | Until event completes | ✅ (for popup) |
| Background Sync | Short burst | ❌ |
| Clients API Messaging | While tab is open | ❌ |
| Periodic Sync (Chrome) | Scheduled | ❌ |

## 🧱 Limitations and Constraints

- No persistent execution: Browsers don’t let service workers run forever.
- Popups are restricted: Must be directly tied to user gestures.
- Cross-origin restrictions: Service workers can’t open cross-origin popups.

📐 Recommended Strategy

- Want something that survives restarts and still pops windows?
- Use push notifications as the trigger
- Store data in IndexedDB (not memory)
- Rely on notification clicks for window focus/open
- Schedule background tasks via Background Sync

This architecture walks the fine line between capability and security, leveraging modern browser features without tripping the popup police.

Next time someone asks, “Who let the workers out?”, you’ll know exactly who, and more importantly, how.
