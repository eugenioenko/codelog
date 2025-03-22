---
author: Eugene Yakhnenko
pubDatetime: 2025-03-17
title: Shake that Tree
slug: javascript-tree-shaking
featured: false
tags:
  - javascript
  - library
  - tree
  - shaking
description: Tree Shaking in JavaScript Libraries - Default vs. Named Exports
---

# Tree Shaking in JavaScript Libraries: Default vs. Named Exports

Tree shaking is an optimization technique that eliminates unused code in JavaScript bundles, significantly reducing the size of applications that consume libraries. When developing JavaScript libraries, the export pattern can dramatically impact your consumers' ability to benefit from tree shaking. Let's explore this with some concrete examples.

## Understanding Tree Shaking Limitations with Default Exports

Default exports can prevent tree shaking in several patterns used in JavaScript libraries, resulting in bloated bundles for consumers. Let's review some of these patterns.

### The Object Pattern Problem

One of the most common anti-patterns that prevents tree shaking occurs when developers use default exports to export multiple functionalities as properties of a single object:

```javascript
// utils.js
function formatDate(date) {
  /* implementation */
}
function formatMoney(amount) {
  /* implementation */
}
function formatPhoneNumber(number) {
  /* implementation */
}

export default {
  formatDate,
  formatCurrency,
  formatPhoneNumber,
};
```

When consumers import this module, even if they only need one function, they get the entire object:

```javascript
// consumer.js
import utils from "./utils";
utils.formatDate(new Date()); // Only using formatDate
```

In this scenario, the bundler cannot determine that `formatCurrency` and `formatPhoneNumber` are unused because the entire object is being imported as a single unit. This effectively breaks tree shaking, causing all functions to be included in the final bundle. It also makes it impossible for the consumer to only import `formatDate` function because the whole object is exported.

### Namespace Re-exports

Another problematic pattern involves re-exporting namespace imports:

```javascript
// constants.js
export const foo = "foo";
export const bar = "bar";

// namespaced-constants.js
import * as constants from "./constants";
export { constants };

// consumer.js
import { constants } from "./namespaced-constants";
console.log(constants.foo); // Only using foo
```

This pattern prevents tree shaking because the bundler cannot analyze which properties of the re-exported namespace are actually used by consumers. Both `foo` and `bar` will be included in the final bundle even though only `foo` is used.

### React Component Libraries

This issue is particularly prevalent in React component libraries:

```javascript
// components.js
const Button = () => {
  /* implementation */
};
const Input = () => {
  /* implementation */
};
const Select = () => {
  /* implementation */
};

export default {
  Button,
  Input,
  Select,
};
```

When a consumer only needs one component, they still receive the entire library:

```javascript
// App.js
import Components from "./components";
function App() {
  return <Components.Button />; // Only using Button
}
```

## Enabling Tree Shaking with Named Exports

Named exports provide a great approach for library authors who want to enable effective tree shaking for their consumers.

### Individual Named Exports

The most straightforward pattern uses individual named exports:

```javascript
// utils.js
export function formatDate(date) {
  /* implementation */
}
export function formatCurrency(amount) {
  /* implementation */
}
export function formatPhoneNumber(number) {
  /* implementation */
}
```

Consumers can then import only what they need:

```javascript
// consumer.js
import { formatDate } from "./utils";
formatDate(new Date());
```

With this approach, bundlers can now analyze the import statements and determine that only `formatDate` is used and avoid bundling the unused functions.

### Effective Re-exports

When aggregating exports from multiple files, using the `export *` syntax provides better tree shaking than re-exporting namespace objects:

```javascript
// constants/index.js
export * from "./dateConstants";
export * from "./currencyConstants";
export * from "./validationConstants";

// consumer.js
import { isoDateFormatter } from "./constants";
```

This pattern allows bundlers to trace imports through multiple modules and include only the necessary code.

### Component Library Example

For React component libraries, named exports provide superior tree shaking:

```javascript
// components.js
export const Button = () => {
  /* implementation */
};
export const Input = () => {
  /* implementation */
};
export const Select = () => {
  /* implementation */
};

// App.js
import { Button } from "./components";
function App() {
  return <Button />;
}
```

Or when needing to combine multiple exports into single re-exporting module use `export *` format:

```javascript
// index.js
export * from "./buttons";
export * from "./inputs";
export * from "./select";
```

Modern bundlers like webpack and rollup can easily determine that only the `Button` component is being used and exclude `Input` and `Select` from the final bundle.

### Practical Impact on Bundle Size

The practical impact of these differences can be substantial in real-world applications. For example, a UI library with 50 components might be 500KB in total size. With proper tree shaking using named exports, an application that only uses 5 of those components might include just 50KB of code. Without tree shaking due to default exports, the entire 500KB library would be included.

## Key Takeaways

1. Use named exports for all public API components to enable effective tree shaking
2. Avoid exporting objects with multiple properties as default exports
3. When aggregating exports from multiple files, use `export *` or individual named exports rather than namespace objects
4. Consider adding ESLint rules to enforce these patterns across your codebase
5. When using `export default` make sure to export from different modules and not re-export from a single one. If you do need to re-export from single one, only do `export { default as Name}`

## Final Thoughts

The choice between default and named exports is not merely stylistic, it has significant implications for the performance of applications that consume your library. Default exports, particularly when used to export multiple functionalities as a single object, can prevent effective tree shaking. In contrast, named exports enable bundlers to precisely identify and include only the code that's actually used.

TLDR; Stick to named exports, they are clear winners when it comes to tree shaking capabilities.
