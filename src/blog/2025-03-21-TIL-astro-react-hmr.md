---
author: Eugene Yakhnenko
pubDatetime: 2025-03-21
title: TIL - Astro with React components and HMR issues
slug: astro-react-hmr
featured: false
tags:
  - til
description: Astro + React Can Get Stuck in an Infinite Reload Loop
---

# TIL: Astro + React Can Get Stuck in an Infinite Reload Loop

Today, I ran into a strange issue while working with Astro and React for this blog. I had refactored a few components to use React inside an Astro page, committed the code, and called it a day.

A few weeks later, I set up a Linux rig and started working on some updates for the blog. That’s when I noticed that HMR (Hot Module Replacement) was getting stuck in an infinite loop after just two code updates. At first, I thought it was a quirk with Chrome on Linux. I tried Firefox, same issue. Tried it on Windows, same issue.

That’s when I had to accept that the problem was in the codebase 🥹.

I attempted to update dependencies, but that didn’t help.
(On the good side, this blog is now running on latest packages Astro included)

After a few hours of debugging, I discovered the culprit: if a React component inside an Astro file gets into a state where it re-renders too frequently (e.g., due to event listeners or state updates triggering a refresh ), Astro's HMR can break and cause a reload loop 😵‍💫. In my case just having a component with an `onClick` would create the issue. There must be something off with the setup, it can't be just that.

In the meantime, refactored the components to use astro syntax and hmr is nice and snappy.

If you had similar issues before, what did you do to resolve it?
(Asking for a friend 😅)
