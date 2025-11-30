---
author: Eugene Yakhnenko
pubDatetime: 2025-11-26
title: "JavaScript Proxy and Reflect API: Intercepting Object Operations"
slug: javascript-proxy-reflect-api
featured: false
tags:
  - javascript
  - proxy
  - reflect
description: "Deep dive into JavaScript Proxy and Reflect API for intercepting object operations, with practical examples of validation, logging, and computed properties"
---

# JavaScript Proxy and Reflect API: Intercepting Object Operations

The Proxy and Reflect APIs are powerful JavaScript features that allow you to intercept and customize fundamental operations on objects. While they've been around since ES6 and used by major JavaScript frameworks, many developers haven't explored their full potential because they are rarely used in everyday application development. Let's dive deep into how these APIs work and when to use them.

## What is a Proxy?

A Proxy is a wrapper around an object that allows you to intercept and redefine fundamental operations for that object. Think of it as a middleware layer between your code and the actual object.

The basic syntax is:

```javascript
const proxy = new Proxy(target, handler);
```

- **target**: The original object you want to wrap
- **handler**: An object containing "traps" (methods) that intercept operations

## Understanding Traps

Traps are methods in the handler object that intercept specific operations. Here are the most commonly used traps:

- `get`: Intercepts property access
- `set`: Intercepts property assignment
- `has`: Intercepts the `in` operator
- `deleteProperty`: Intercepts the `delete` operator
- `apply`: Intercepts function calls
- `construct`: Intercepts the `new` operator

## Practical Example: Validation

One of the most common use cases for Proxy is runtime validation. Let's create a user object that validates data on assignment:

```javascript
function createValidatedUser(data) {
  const handler = {
    set(target, property, value) {
      if (property === "age") {
        if (typeof value !== "number") {
          throw new TypeError("Age must be a number");
        }
        if (value < 0 || value > 150) {
          throw new RangeError("Age must be between 0 and 150");
        }
      }

      target[property] = value;
      return true;
    },
  };

  return new Proxy(data, handler);
}

const user = createValidatedUser({ name: "Alice" });

user.age = 30; // Works fine
// user.age = -5; // Throws RangeError
```

## Logging and Debugging

Proxies are excellent for debugging object interactions. Here's a logging proxy that tracks all property accesses:

```javascript
function createLoggingProxy(obj, name = "Object") {
  return new Proxy(obj, {
    get(target, property) {
      console.log(`[${name}] Getting property "${String(property)}"`);
      return target[property];
    },
    set(target, property, value) {
      console.log(
        `[${name}] Setting property "${String(property)}" to:`,
        value
      );
      target[property] = value;
      return true;
    },
  });
}

const config = createLoggingProxy({ theme: "dark", version: 1 }, "Config");

config.theme; // Logs: [Config] Getting property "theme"
config.language = "en"; // Logs: [Config] Setting property "language" to: en
```

## Computed Properties

Proxies can dynamically compute property values on access:

```javascript
function createComputedObject(data, computedProps) {
  return new Proxy(data, {
    get(target, property) {
      // Check if it's a computed property
      if (property in computedProps) {
        return computedProps[property](target);
      }
      // Otherwise return the regular property
      return target[property];
    },
  });
}

const person = createComputedObject(
  { firstName: "John", lastName: "Doe", birthYear: 1990 },
  {
    fullName: obj => `${obj.firstName} ${obj.lastName}`,
    age: obj => new Date().getFullYear() - obj.birthYear,
  }
);

console.log(person.fullName); // "John Doe"
console.log(person.age); // 35 (in 2025)
```

This example shows how to define computed properties that derive their values from other properties dynamically emulating how getters/setters work.

## The Reflect API

The Reflect API provides methods for interceptable JavaScript operations.
Every Proxy trap has a corresponding Reflect method. Think of Reflect as the default behavior you'd get without a Proxy.

Why use Reflect instead of direct operations? Several reasons:

1. **Consistent return values**: Reflect methods return boolean success indicators
2. **Function-based**: All operations become function calls
3. **Default behavior**: Easy to call default behavior from within traps

Here's an example showing why Reflect is useful:

```javascript
const handler = {
  set(target, property, value, receiver) {
    console.log(`Setting ${String(property)} to ${value}`);

    // Using Reflect for default behavior
    return Reflect.set(target, property, value, receiver);

    // Instead of: target[property] = value; return true;
  },
};

const obj = new Proxy({}, handler);
```

## Advanced Example: Observable Object

Let's create an observable object that notifies listeners only when properties change:

```javascript
function createObservable(target, callback) {
  const handlers = {
    set(obj, property, value) {
      const oldValue = obj[property];
      const result = Reflect.set(obj, property, value);

      if (result && oldValue !== value) {
        callback(property, oldValue, value);
      }

      return result;
    },
  };

  return new Proxy(target, handlers);
}

// Usage
const state = createObservable({ count: 0 }, (prop, oldVal, newVal) => {
  console.log(`${prop} changed from ${oldVal} to ${newVal}`);
});

state.count = 1; // Logs: count changed from 0 to 1
state.count = 2; // Logs: count changed from 1 to 2
state.count = 2; // No log, value didn't change
```

In this last example, we created an observable object that triggers a callback whenever a property changes, showcasing how Proxies can be used for reactive programming patterns. Lets say you are building a UI framework or state management library, the callback could trigger UI updates or notify subscribers.

## Proxy vs Object.defineProperty

Before Proxy, `Object.defineProperty` was the go-to method for intercepting property operations. Let's compare:

### Object.defineProperty Approach

```javascript
function createUserOld(data) {
  const _data = { ...data };
  const user = {};

  Object.defineProperty(user, "age", {
    get() {
      return _data.age;
    },
    set(value) {
      if (typeof value !== "number" || value < 0) {
        throw new Error("Invalid age");
      }
      _data.age = value;
    },
  });

  return user;
}
```

### Proxy Approach

```javascript
function createUserNew(data) {
  return new Proxy(data, {
    set(target, property, value) {
      if (property === "age") {
        if (typeof value !== "number" || value < 0) {
          throw new Error("Invalid age");
        }
      }
      return Reflect.set(target, property, value);
    },
  });
}
```

### Key Differences

| Feature                 | Object.defineProperty                  | Proxy                                         |
| ----------------------- | -------------------------------------- | --------------------------------------------- |
| **New properties**      | Must define each property individually | Intercepts all properties, including new ones |
| **Array operations**    | Cannot intercept array methods         | Can intercept array methods                   |
| **Multiple operations** | Limited to get/set                     | Supports 13 different traps                   |
| **Performance**         | Slightly faster                        | Slightly slower but negligible                |
| **Property deletion**   | Cannot intercept                       | Can intercept with deleteProperty trap        |
| **Browser support**     | Excellent (IE9+)                       | Good (no IE support)                          |

## Proxy for Array Operations

One powerful feature of Proxy is intercepting array operations:

```javascript
function createValidatedArray(maxLength = 10) {
  return new Proxy([], {
    set(target, property, value) {
      if (property === "length") {
        return Reflect.set(target, property, value);
      }

      const index = Number(property);
      if (Number.isInteger(index)) {
        if (target.length >= maxLength) {
          throw new Error(`Array cannot exceed ${maxLength} items`);
        }
      }

      return Reflect.set(target, property, value);
    },
  });
}

const limitedArray = createValidatedArray(3);

limitedArray.push(1); // OK
limitedArray.push(2); // OK
limitedArray.push(3); // OK
// limitedArray.push(4); // Throws Error
```

## Negative Array Indices (Python-style)

Here's a fun example implementing Python-style negative indexing:

```javascript
function createSmartArray(arr = []) {
  return new Proxy(arr, {
    get(target, property) {
      const index = Number(property);

      if (Number.isInteger(index) && index < 0) {
        // Negative index: -1 is last element, -2 is second to last, etc.
        return target[target.length + index];
      }

      return Reflect.get(target, property);
    },
  });
}

const arr = createSmartArray([1, 2, 3, 4, 5]);

console.log(arr[-1]); // 5 (last element)
console.log(arr[-2]); // 4 (second to last)
console.log(arr[-5]); // 1 (first element)
```

## Private Properties with Proxy

Create objects with truly private properties:

```javascript
function createPrivateObject(data, privateKeys = []) {
  return new Proxy(data, {
    get(target, property) {
      if (privateKeys.includes(property)) {
        throw new Error(`Cannot access private property: ${String(property)}`);
      }
      return Reflect.get(target, property);
    },
    set(target, property, value) {
      if (privateKeys.includes(property)) {
        throw new Error(`Cannot modify private property: ${String(property)}`);
      }
      return Reflect.set(target, property, value);
    },
    has(target, property) {
      if (privateKeys.includes(property)) {
        return false;
      }
      return Reflect.has(target, property);
    },
  });
}

const user = createPrivateObject({ name: "Alice", _password: "secret123" }, [
  "_password",
]);

console.log(user.name); // "Alice"
// console.log(user._password); // Throws Error
console.log("_password" in user); // false (hidden from 'in' operator)
```

## Performance Considerations

While Proxies are powerful, they do have a small performance overhead. Here are some tips:

1. **Don't proxy everything**: Only use Proxies when you need dynamic interception
2. **Cache when possible**: If computing values, consider caching results
3. **Use Reflect for default behavior**: It's optimized for this purpose
4. **Avoid deep nesting**: Deeply nested proxies can compound performance overhead

## When NOT to Use Proxy: Architectural Trade-offs

While Proxies are powerful, they're not always the right solution. Understanding when to avoid them is just as important as knowing when to use them.

### 1. Performance-Critical Code Paths

Proxies add overhead to every intercepted operation. In tight loops or performance-critical code, this overhead compounds:

```javascript
// Avoid in hot paths
const proxiedArray = new Proxy([], {
  /* handlers */
});

for (let i = 0; i < 1_000_000; i++) {
  proxiedArray.push(i); // Each push goes through proxy trap
}

// Better: Use regular array, convert if needed
const regularArray = [];
for (let i = 0; i < 1_000_000; i++) {
  regularArray.push(i);
}
const proxiedResult = new Proxy(regularArray, {
  /* handlers */
});
```

**Benchmark impact**: Proxy operations can be 2-10x slower than direct property access depending on the operation and JavaScript engine.

### 2. Simple Data Structures

For simple, static objects where you control all access points, Proxies add unnecessary complexity:

```javascript
// Overkill for simple config
const config = new Proxy(
  { apiUrl: "https://api.example.com" },
  {
    get(target, prop) {
      console.log(`Accessing ${prop}`);
      return target[prop];
    },
  }
);

// Just use a regular object
const config = Object.freeze({ apiUrl: "https://api.example.com" });
```

### 3. Deep Object Hierarchies Without Recursive Proxying

Proxies don't automatically proxy nested objects. If you need deep reactivity, you must recursively proxy:

```javascript
// Shallow proxy - nested objects aren't reactive
const state = new Proxy(
  {
    user: { name: "Alice" },
  },
  {
    set(target, prop, value) {
      console.log("Changed:", prop);
      return Reflect.set(target, prop, value);
    },
  }
);

state.user.name = "Bob"; // NOT intercepted!

// Need recursive proxying (complex and memory-intensive)
function deepProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop];
      if (value && typeof value === "object") {
        return deepProxy(value); // Creates new Proxy for each access!
      }
      return value;
    },
    // ... other traps
  });
}
```

**Trade-off**: Deep proxying creates many proxy instances and can significantly increase memory usage and bloat garbage collector.

### 4. Third-Party Library Integration

Libraries that expect plain objects or use object identity checks can break with Proxies:

```javascript
// Some libraries check object types
const data = new Proxy({ items: [1, 2, 3] }, handlers);

// Libraries using strict equality or instanceof may fail
Array.isArray(data.items); // true
data instanceof Object; // true, but proxy can interfere with custom checks

// Some serialization libraries may not handle Proxies correctly
JSON.stringify(data); // Works, but proxy traps aren't called
```

### 5. Debugging Complexity

Proxies can make debugging harder because the source of operations is obscured:

```javascript
// Stack traces become harder to follow
const obj = new Proxy(
  {},
  {
    get(target, prop) {
      return anotherProxy[prop]; // Proxy chains make debugging difficult
    },
  }
);

// Browser DevTools may not show the real object structure
console.log(obj); // Shows Proxy object, not underlying data
```

This is a common issue when debugging Ember.js applications.

**Debugging Tips**:

- **Node.js**: Use `util.inspect(proxy, { showProxy: true })` to see both proxy and target
- **Browser**: Use `console.log({...proxy})` to spread the properties into a new object for easier viewing. This won't show Proxy internals but gives a clearer view of the data.
- **Browser DevTools**: Most modern browsers let you expand the `[[Target]]` property in the console
- **Access the target directly**: If you control the Proxy creation, store a reference to the target
- **Ember.js specific**: Use Ember Inspector browser extension to see tracked values
- **Vue.js specific**: Use Vue DevTools to inspect reactive state

### 6. IE11 or Legacy Browser Support

Proxies cannot be polyfilled and are not supported in Internet Explorer:

```javascript
// No fallback possible
if (typeof Proxy === "undefined") {
  // Can't polyfill Proxy - must use Object.defineProperty or other approach
  throw new Error("Proxy not supported");
}
```

**Trade-off**: If you need to support older browsers, stick with `Object.defineProperty`.

### 7. Value Types and Primitives

Proxies only work with objects. You can't proxy primitives directly:

```javascript
// Can't proxy primitives
const num = new Proxy(42, {}); // TypeError: Cannot create proxy with non-object

// Must wrap in object
const wrapped = new Proxy(
  { value: 42 },
  {
    get(target, prop) {
      if (prop === "value") return target.value;
      // Add custom behavior
    },
  }
);
```

### 8. When Simpler Alternatives Exist

Don't reach for Proxy when simpler patterns suffice:

```javascript
// Overengineered validation
const validated = new Proxy(
  {},
  {
    set(target, prop, value) {
      if (prop === "age" && typeof value !== "number") {
        throw new TypeError("Age must be number");
      }
      return Reflect.set(target, prop, value);
    },
  }
);

// Simple validation function
function setAge(obj, age) {
  if (typeof age !== "number") {
    throw new TypeError("Age must be number");
  }
  obj.age = age;
}
```

### Architectural Decision Framework

Ask yourself these questions before using Proxy:

| Question                                     | Use Proxy  | Consider Alternatives |
| -------------------------------------------- | ---------- | --------------------- |
| Need to intercept _all_ property operations? | ✅         | ❌                    |
| Working with dynamic/unknown properties?     | ✅         | ❌                    |
| Performance is critical?                     | ❌         | ✅                    |
| Need to support IE11?                        | ❌         | ✅                    |
| Simple validation or transformation?         | ❌         | ✅                    |
| Building a framework/library?                | ✅         | ❌                    |
| One-off utility in app code?                 | ❌         | ✅                    |
| Deep object nesting required?                | ⚠️ Complex | ✅                    |

### Best Practice: Start Simple, Add Complexity When Needed

```javascript
// Phase 1: Start with plain object
const state = { count: 0 };

// Phase 2: Add getters/setters if needed
class State {
  #count = 0;
  get count() {
    return this.#count;
  }
  set count(val) {
    if (typeof val !== "number") throw new TypeError();
    this.#count = val;
  }
}

// Phase 3: Only use Proxy when dynamic behavior is essential
const dynamicState = new Proxy(
  {},
  {
    set(target, prop, value) {
      // Complex validation logic for any property
      return Reflect.set(target, prop, value);
    },
  }
);
```

The key principle: **Use the simplest tool that solves your problem**. Proxies are powerful but not always the right choice. Consider the maintenance burden, performance implications, and team familiarity before committing to a Proxy-based architecture.

## Real-World Use Cases

Proxies are used in many popular libraries:

- **Vue.js 3**: Uses Proxies for reactive data binding
- **Ember.js**: Uses Proxies for `@tracked` properties
- **MobX**: Uses Proxies for observable state
- **Immer**: Uses Proxies for immutable state updates
- **Testing libraries**: Create mock objects with automatic spy tracking

## Browser Support

Proxies are well-supported in modern browsers:

- Chrome 49+
- Firefox 18+
- Safari 10+
- Edge 12+
- Node.js 6+

**Important**: Proxies cannot be polyfilled because they require engine-level support.

## Vue.js 3 Reactivity System

**Vue.js 3** completely rewrote its reactivity system to use Proxies instead of `Object.defineProperty` (which Vue 2 used). This change brought significant improvements:

- **Dynamic property detection**: No need for `Vue.set()` - new properties are automatically reactive
- **Array mutation detection**: Array index assignments and length changes are tracked automatically
- **Better performance**: More efficient change detection with fewer edge cases

Vue's `reactive()` function wraps objects in Proxies to track dependencies and trigger updates:

```javascript
import { reactive, watchEffect } from "vue";

const state = reactive({
  count: 0,
  items: [],
});

// Automatically tracks dependencies
watchEffect(() => {
  console.log(`Count is: ${state.count}`);
});

state.count = 1; // Triggers the watchEffect
state.items[0] = "new item"; // Also reactive (unlike Vue 2!)
state.newProp = "dynamic"; // Automatically reactive (no Vue.set needed!)
```

Under the hood, Vue uses a combination of Proxy traps (`get`, `set`, `has`, `deleteProperty`) along with `Reflect` to implement its dependency tracking system. When you access a reactive property during rendering or in a computed property, Vue records it as a dependency. When that property changes, all dependent components re-render.

## Ember.js and @tracked

**Ember.js** (Octane edition and later) uses Proxies to power its `@tracked` decorator for reactive properties. When you mark a property with `@tracked`, Ember wraps the object in a Proxy to automatically detect when the property changes and trigger re-renders. This is similar to Vue 3's reactivity system but integrated into Ember's decorator-based API.

```javascript
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export default class Counter extends Component {
  @tracked count = 0; // Proxy-based reactivity

  increment = () => {
    this.count = this.count + 1; // Triggers re-render via set trap
  };
}
```

This transition from `Ember.Object` and computed properties to `@tracked` values was a major shift in Ember's architecture, made possible by Proxy support in modern browsers.

## Parting Thoughts

The Proxy and Reflect APIs provide powerful metaprogramming capabilities in JavaScript. They enable:

- Runtime validation and type checking
- Debugging and logging
- Computed and virtual properties
- Observable/reactive patterns
- API mocking and testing

While `Object.defineProperty` is still useful for specific cases, Proxy offers a more comprehensive and flexible solution for intercepting object operations. The key is understanding when the overhead is justified by the functionality you need.

Start experimenting with Proxies to learn their capabilities, but always weigh the trade-offs before adopting them in production code.
IMHO, Proxies are best suited for libraries, frameworks where dynamic behavior is essential. Even in cases of complex applications, the benefits can be substantial. For simpler use cases, traditional patterns may suffice.

## Signals

JavaScript Proxies can also be used to implement reactive programming patterns similar to Signals found in other frameworks. By intercepting property accesses and updates, you can create a system where changes to data automatically propagate to dependent computations or UI updates.

Signals have been proposed for JavaScript as a way to manage reactivity more declaratively. While not yet a standard part of JavaScript, you can simulate signal-like behavior using Proxies.

## Further Reading

- [MDN: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN: Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [Signal proposal](https://github.com/tc39/proposal-signals)
