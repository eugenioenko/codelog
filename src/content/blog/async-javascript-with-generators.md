---
author: Eugene Yakhnenko
pubDatetime: 2023-12-06
title: Asynchronous JavaScript with Generator Functions
slug: async-javascript-with-generators
featured: false
tags:
  - javascript
  - async
  - await
  - generator functions
description: Asynchronous JavaScript with Generator Functions
---

In the realm of JavaScript, managing asynchronous operations has traditionally been a challenge. Promises and generators introduced a more elegant way to handle asynchronous code, and with a touch of creativity, developers have created utilities to enhance this experience. In this blog post, we'll explore a concise utility function called `asynq` that leverages generators to simulate asynchronous behavior.

## The await Operator:

The `await` operator in JavaScript is used in an `async` function to pause execution until a Promise is resolved or rejected. It allows asynchronous code to be written in a more synchronous fashion, making it easier to work with Promises.

Here a small example of how modern `await` operator can be used:

```javascript
async function getData() {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  const data = await response.json();
}
```

Previous snippet fetches data from a server and stores the parsed JSON response in the variable, leveraging the async/await syntax for handling asynchronous operations more elegantly.

## The `asynq` Utility:

Let's dive into the code snippet that defines the `asynq` utility:

```javascript
function asynq(promise) {
  const generator = promise();

  (function next(value) {
    const it = generator.next(value);

    if (it.done) {
      return it.value;
    } else {
      return Promise.resolve(it.value).then(next);
    }
  })();
}
```

The `asynq` function takes a promise as an argument, creating a generator by invoking it. The magic happens inside the immediately-invoked function expression (IIFE) named `next`.
This function recursively processes the generator's values until completion, effectively simulating asynchronous iteration.

### Usage Example with `getData`:

Let's see `asynq` in action with a practical example:

```javascript
function* getData() {
  const data1 = yield 1;
  console.log(data1);

  const data2 = yield new Promise(resolve => {
    resolve(2);
  });
  console.log(data2);

  const response = yield fetch("https://jsonplaceholder.typicode.com/todos/1");
  const data3 = yield response.json();
  console.log(data3);
}

asynq(getData);
```

In this `getData` generator function, we witness the power of `asynq`. It gracefully handles both synchronous and asynchronous values. The generator yields integers, Promises, and even the result of a `fetch` call, showcasing the flexibility of this utility.

## Wrapping it Up

JavaScript's native async/await syntax, widely adopted for its readability and ease of use, is intricately connected to the concept of generators.

The `asynq` utility we explored in this article opens a little window into how `await` operator works internally.

The `await` operator is exclusive to `async` functions. Same way as `yield` operator is exclusive to generator functions.

Attempting to use `await` outside of an `async` function results in a syntax error. Same as using `yield` operator outside of a generator function results in a syntax error too.

Try out asynchronous code with `asynq` utility and in doing so, uncover the similarities between generators and asynchronous code with async/await that propels modern javascript
