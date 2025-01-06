---
author: Eugene Yakhnenko
pubDatetime: 2024-09-18
title: Debouncing State in React
slug: debouncing-state-react
featured: false
tags:
  - react
  - state
  - debounce
description: Debouncing State in React
---

When building interactive components in react that depend on user input and specially keyboard input, it's common to end in a situation where an API call is made for every key pressed which leads to performance and ux issues. Too many unnecessary API calls are made and also it's not guaranteed that those calls are gonna return in order, so the results might not even be for the last searched value. A way to solve this problem is to debounce the user input which is what this article is gonna explore.

## What is debouncing?

Debouncing ensures that a value is updated or a function is called only after a certain amount of time has passed since the last function call. The debounced value "lags" behind and is updated less frequently but it guarantees to get the latest value at the end.

## Is useDeferredValue debouncing?

No, useDeferredValue is not the same as debouncing. While both useDeferredValue and debouncing help to manage updates efficiently and improve performance, they serve different purposes and work in distinct ways.

The purpose of [useDeferredValue](https://react.dev/reference/react/useDeferredValue) is to defer a low-priority update so that higher-priority updates (such as visual UI updates) can be processed first. It allows React to prioritize rendering more critical parts of the UI, improving responsiveness, especially in cases where there are complex or expensive computations happening in the background.

> Unlike debouncing, it doesn’t require choosing any fixed delay. If the user’s device is fast (e.g. powerful laptop), the deferred re-render would happen almost immediately and wouldn’t be noticeable. If the user’s device is slow, the list would “lag behind” the input proportionally to how slow the device is.

[source](https://react.dev/reference/react/useDeferredValue#how-is-deferring-a-value-different-from-debouncing-and-throttling)

## Debouncing with lodash \_.debounce

The [\_.debounce](https://lodash.com/docs/#debounce) creates a debounced function that delays invoking func until after wait milliseconds have elapsed since the last time the debounced function was invoked.
Using lodash’s debounce combined with useMemo is a good choice especially if lodash is already part of your project (stay tuned for a feature article exploring this combination)

## Custom useDebouncedValue hook

This hook takes a value and a delay, and it returns the debounced version of that value. If the value changes, the hook will wait for the specified delay before updating the debounced value. If the value changes again within the delay period, the timer resets, and the value is debounced once more.

Here’s how you can implement it:

```tsx
import { useEffect, useRef, useState } from "react";

export function useDebouncedState<T>(initial: T, timeInMs: number = 250) {
  const [value, setValue] = useState(initial);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValue = useRef<T>(initial);

  const setDebouncedValue = (newValue: T) => {
    if (lastValue.current === newValue) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (lastValue.current !== newValue) {
        setValue(newValue);
      }
      lastValue.current = newValue;
    }, timeInMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setDebouncedValue] as const;
}
```

### How It Works

- **State Management**: The hook uses useState to store the debounced value. Initially, it’s set to the passed-in value.

- **Effect Hook**: Inside useEffect, a setTimeout is triggered, which will update the debouncedValue after the specified delay (in milliseconds).

- **Cleanup**: The return function in useEffect clears the timeout when either the value or the delay changes. This ensures that no outdated updates are applied, preventing memory leaks and keeping the debounce behavior stable.

### Usage Example

Imagine you’re building a search bar that triggers an API request on every user input. To avoid making too many unnecessary requests while the user types, you can debounce the search term like this:

```tsx
import { useDebouncedState } from "@/hooks/use-debounce";
import { useEffect } from "react";

export const Books = () => {
  const [search, setSearch] = useDebouncedState("");

  useEffect(() => {
    console.log(search);
  }, [search]);

  return <input type="text" onInput={e => setSearch(e.currentTarget.value)} />;
};
```

_(note: it’s possible to use onChange instead of onInput but it does require for the user to focus out of the input to be triggered which in case of an autocomplete, this might not be desired)_

useDebouncedState hook has been designed in a way that it can be a “drop in” replacement for “useState” hook when throttling is required, so if you ever need debouncing I hope this article got you inspired and covered!
If you ever needed to debounce in the past, what was your solution at that time? Leave a comment!
