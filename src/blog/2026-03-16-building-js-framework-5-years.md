---
auth: Eugene Yakhnenko
title: "Building a JavaScript Framework (and Failing Twice at Reactivity)"
pubDatetime: 2026-03-16T12:00:00Z
featured: true
slug: building-js-framework-5-years
tags:
  - javascript
  - frameworks
  - reactivity
  - ai
  - testing
description: "A project started five years ago, paused, revisited, and eventually finished. Two failed attempts at reactivity, 600+ tests, and an unexpected lesson about using AI as both developer and user."
---

About five years ago, I didn't set out to build a framework I'd use in production.

I just wanted to understand them.

I had already written parsers and interpreters before, so I knew the mechanics — tokenization, ASTs, execution. But frameworks felt different. They weren't just about parsing code; they were about state, updates, and keeping the UI in sync. Reactivity was the part I didn't understand. So I decided to build one from scratch.

I started with the pieces I knew: a scanner, a parser, a JavaScript interpreter, and an HTML template parser. After a while, I had a working system — a small component model and a template engine that could render real views. It looked like a framework.

But it was missing the one thing that actually makes a framework feel alive: reactivity.

---


```html
<template>
  <h1>{{count.value}}</h1>
  <div class="actions">
    <button @on:click="count -= 1">-</button>
    <button @on:click="count += 1">+</button>
  </div>
</template>

<script>
  import { signal, Component } from 'kasper-js';

  export class Counter extends Component {
    count = signal(0);
  }
</script>

<style>
  h1 {
   font-size: 2rem;
  }
</style>
```

---

## The Part That Failed Twice

I tried implementing reactivity early on. It didn't work. I've tried with using Proxy, I tried just using a render() function, it was not clicking.

Later, I tried again. This time I got something running; but it was fragile. It only worked for a single component. Child updates broke. State invalidation was inconsistent. It looked like reactivity, but you couldn't trust it.

So I dropped it again.

---

## Coming Back to It

The project sat dormant for a long time, almost abandoned. Other projects took over. Life moved on. After a few years away, I returned to it. This time, I approached it differently. Instead of trying to "add reactivity," I focused on correctness first, testing everything, and simplifying assumptions.

With the help of AI agents, I rebuilt the system around signals.

That changed everything.

Once signals were in place, the architecture became much simpler: no virtual DOM, no diffing, direct updates to real DOM nodes, fine-grained reactivity. But the real breakthrough wasn't just the model. It was the process.

---

## 600 Tests Later

I started adding tests. Then more tests. Then hundreds more. With AI assistance, I reached 600+ test cases. At that point, something unexpected happened: the AI couldn't generate any new meaningful tests. Everything obvious and most non-obvious cases were already covered.

The test were meaningful. It felt complete. 

But it wasn't. Of course it wasn't. Just because 600+ tests pass it doesn't mean your system has no bugs. 

---

## The Real Test Wasn't Tests

The codebase looked solid. The tests passed. But there was still a problem: no one had actually used the framework to build real apps.

So I tried something different. Instead of writing apps manually, I asked AI agents to build them.

And they failed immediately.

Not because the framework was broken; but because the AI didn't know how to use it. This was a surprising moment. The system worked, but it wasn't understandable.

---

## The Missing Piece: Documentation for AI

That's when I introduced something modern: `llms.txt`.

A dedicated, structured specification designed for AI agents. Not marketing docs. Not tutorials. Just syntax, rules, constraints, and examples. Think of it as a "principal engineer version" of the API.

Then I started a loop: give the AI the spec, ask it to build an app, observe where it fails, update the spec, repeat.

After a few iterations, something remarkable happened. The AI started generating full apps on the first try: todo apps, CRUD interfaces, Kanban boards, tree views, infinite scroll, even Game of Life. All working.

---

## A Surprising Insight About AI

At one point, the AI became very confident about a "necessary" architectural change. It proposed a redesign that would require around 100 lines of changes. We tried it. It failed repeatedly.

After stepping back and analyzing the problem, the real fix was 5 lines of code.

That moment stuck with me. AI can be incredibly helpful but it can also confidently overcomplicate problems.

---

## When Tests Stop Helping

With 600+ tests, the system looked stable. But once the AI started generating real applications, new edge cases appeared: subtle rendering issues, lifecycle timing problems, data edge cases that no unit test would have caught in isolation.

So I kept going. Built more apps (shopping cart, dashboards, editors), fed failures back into the system, and added more tests. Real usage found things that testing alone never would.

---

## What Actually Made the Framework Stable

Looking back, it wasn't one thing. It was the combination of:

- A simple reactive model (signals)
- Relentless testing (600+ cases)
- Real-world usage (apps, not just tests)
- AI as both a developer and a user

---

## The Unexpected Win

One design choice I made years ago turned out to be critical: the template syntax was valid HTML. Originally, this was just for better syntax highlighting. But later, it made the framework significantly more AI-friendly. No custom grammar. No ambiguity. Just HTML with extensions.

---

## What I'd Do Differently

If I started today, I would design the reactive model first, write tests earlier (a lot earlier), treat AI as a first-class user from day one, and create a machine-readable spec alongside human docs.

---

## Where It Ended Up

After years of on-and-off work, multiple failures, and hundreds of tests, the framework is stable. Not because it's perfect, but because it survived repeated redesigns, real usage, and constant pressure from both humans and machines.

Building the framework wasn't the hardest part. Making it correct, usable, and understandable for both humans and AI was the real challenge.


---

## Try it out!
Learn more about kasper.js at:
- [kasperjs.top/](https://kasperjs.top)
- [github.com/eugenioenko/kasper-js](https://github.com/eugenioenko/kasper-js)