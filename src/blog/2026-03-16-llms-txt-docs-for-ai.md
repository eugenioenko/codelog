---
auth: Eugene Yakhnenko
title: "We Had to Write Docs for AI (llms.txt Changed Everything)"
pubDatetime: 2026-03-16T13:00:00Z
featured: true
slug: llms-txt-docs-for-ai
tags:
  - ai
  - documentation
  - javascript
  - frameworks
  - llms
description: "Most developers think documentation is for humans. That assumption is already outdated. How a single structured file changed the way AI could use our framework."
---

Most developers think documentation is for humans.

That assumption is already outdated.

While building my JavaScript framework, I ran into a problem I didn't expect: the framework worked — but AI couldn't use it. Not "wasn't perfect." Not "made small mistakes." It completely failed to build even basic apps correctly.

---

## The Moment Things Broke

After years of work, I finally had a stable system: a custom scanner, parser, interpreter, a template engine with components, a signal-based reactivity system, and around 600 tests covering edge cases. I thought I was done.

So I tried something simple: "Build a todo app using this framework."

What I got back looked confident — but was completely wrong. Wrong syntax. Wrong mental model. Invented features that didn't exist.

This wasn't a bug in the framework. It was a documentation failure.

---

## README Is Not Enough Anymore

Traditional documentation is designed for humans: narrative explanations, gradual onboarding, examples mixed with storytelling.

AI doesn't work like that. It doesn't "read" docs — it pattern-matches and guesses. So when the documentation is incomplete, ambiguous, or too prose-heavy, AI fills in the gaps. Confidently. Incorrectly.

---

## The Solution: llms.txt

The solution was simple in hindsight: treat AI like a strict compiler, not a reader.

I created a new file: `llms.txt`. Not marketing docs. Not tutorials. Just raw, explicit specification.

The rules were strict:

**No prose.** No storytelling, no explanations. Only syntax, rules, and constraints.

**No ambiguity.** There's a big difference between:

> You can use `@if` for conditional rendering.

and:

```
@if="condition"
- condition must be a valid JS expression
- evaluates to truthy/falsy
- false removes node from DOM
```

**Complete surface area.** All directives, template expressions, components, lifecycle hooks, signal behavior — everything explicitly defined. Nothing implied.

**Minimal but real examples:**

```html
<ul>
  <li @each="item in items" @key="item.id">
    {{ item.name }}
  </li>
</ul>
```

---

## Reading the Docs + Source Code

Even with `llms.txt`, the AI couldn't just guess everything. It needed to read a lot of source code — inspect function signatures, understand how signals propagate, see how component lifecycle worked. Only then could it map the spec to the actual implementation and generate working apps.

Building apps wasn't magic. It was AI + spec + code comprehension.

---

## The Iteration Loop

I didn't just hand over the file and hope. The loop looked like this:

1. Give AI the current `llms.txt` and source access
2. Ask it to build a real app (todo, kanban, etc.)
3. Observe failures
4. Fix the spec
5. Repeat

A few things became clear along the way.

**Missing features aren't always obvious.** At one point, AI kept trying to use `@keydown.enter`. I had never documented it — but the framework already supported it. The fix was to update the spec, not the code.

**Ambiguity is worse than missing features.** Undocumented features lead to confident guesses. Vaguely documented features lead to confident *wrong* guesses. Explicit rules always win.

**AI exposes your own blind spots.** It suggested massive architectural rewrites — redesign scope tracking, refactor core systems. All seemed convincing. The result: 100 lines of changes, none of which worked. The real fix? Five lines of code. AI can be very persuasive about the wrong solution.

---

## When It Finally Clicked

After a few iterations of refining `llms.txt` and reading source code, AI could reliably generate todo apps, Kanban boards, tree views, infinite scroll, and Game of Life — first try, fully working, following spec.

Real apps also exposed edge cases that 600 unit tests never would: shopping carts, form wizards, markdown editors, live dashboards. The tests covered everything within a known model. Real usage kept expanding the model.

---

## Two Types of Documentation

There are now two distinct audiences for docs:

**Human docs** — explain concepts, tell the story, teach mental models.

**AI docs (`llms.txt`)** — define rules, eliminate ambiguity, maximize correctness.

Both are necessary. They serve completely different purposes and shouldn't be conflated.

---

## The Unexpected Payoff

One design decision made early on turned out to help here too: the template syntax was valid HTML. This meant free syntax highlighting, editor support, and — it turns out — AI-friendly defaults. The more your syntax looks like existing patterns, the less AI has to guess.

---

## Final Thought

The hardest part wasn't building the framework. It wasn't reactivity or performance.

It was making the system understandable to something that doesn't actually understand.

We're entering a world where humans write ideas and AI writes implementations. In that world, specification becomes the product. Not just a supplement to the code — the thing that makes the code usable at all.

---

Learn more about kasper.js at:
- [kasperjs.top](https://kasperjs.top)
- [github.com/eugenioenko/kasper-js](https://github.com/eugenioenko/kasper-js)
