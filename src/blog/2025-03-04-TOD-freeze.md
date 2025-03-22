---
author: Eugene Yakhnenko
pubDatetime: 2025-03-04
title: TOD - Object.freeze
slug: tod-object-freeze
featured: false
tags:
  - tod
description: Tip of the Day, Object.freeze
---

# TOD: Freezing Configuration Objects in JavaScript

In today’s tip, let’s talk about ensuring constant configurations remain truly constant. Consider this example:

```javascript
const config = { url: "https://url.com" };
```

You might assume config is immutable, but it’s not! You can still modify its properties:

```javascript
config.url = "https://new.url.com"; // Allowed!
```

To prevent modifications, a common approach is to use a function:

```javascript
const config = () => ({ url: "https://url.com" });
```

Each call to config() returns a new object, which is better but still not ideal. Here’s the real tip:

```javascript
const config = Object.freeze({ url: "https://url.com" });
```

## Why Object.freeze()?

The Object.freeze() method ensures that:
- No new properties can be added.
- Existing properties cannot be removed or modified.
- The object’s prototype remains unchanged.

[MDN Docs on Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

## Extra Tip for TypeScript Users

If you’re using TypeScript, you can use const assertions to make TypeScript aware that the object is frozen:

```typescript
const config = Object.freeze({ url: "https://url.com" }) as const;
```

TypeScript’s const assertions ensure:

- Literal types don’t widen (e.g., "hello" won’t become string).
- Object literals have readonly properties.
- Array literals become readonly tuples.

[TypeScript 3.4 Const Assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

That’s it! Stay tuned for more JavaScript Tips of the Day!