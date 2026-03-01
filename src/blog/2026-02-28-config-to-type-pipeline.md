---
auth: Eugene Yakhnenko
title: "Our config file is already a type definition. You're just not using it that way."
pubDatetime: 2026-02-28T12:00:00Z
featured: true
slug: config-to-type-pipeline
tags:
  - typescript
  - config
  - vite
description: "A look at how three TypeScript primitives you already have can eliminate an entire class of silent runtime bugs across feature flags, translations, environment variables, and design tokens — with no codegen, no CLI, and no type engine."
---

I want to show you a bug that has shipped in almost every production codebase I've worked in.

It doesn't throw. It doesn't warn. It just silently does the wrong thing — and depending on which version of it you're dealing with, you might not notice for days.

```ts
useFlag('premiumFeaure')
```

One transposed letter. The flag doesn't exist, so it returns `false`, and your entire premium gate is permanently open to everyone. No error. No log. TypeScript is fine with it because `useFlag` accepts `string`, and `'premiumFeaure'` is a perfectly valid string.

By the time you find it, it's been in production for a week.

---

## We accept this because the alternative was worse

Here's the thing: we've known how to solve this for years. You could write a union type:

```ts
type FlagKey = 'darkMode' | 'betaEditor' | 'premiumFeature';
```

Now `useFlag` only accepts valid flag names. Typos are caught at compile time.

Except now you have two sources of truth. The actual flag definitions live somewhere — a config object, a map, an enum — and this union type lives next to them, manually maintained, silently diverging every time someone adds or removes a flag and forgets to update the type.

Which is basically always.

So teams give up and go back to `string`. It's not that they don't care about type safety. It's that the cost of maintaining it is higher than the cost of the occasional bug.

---

## Three primitives you already have

TypeScript has had the tools to solve this properly since version 3.4. Most people just haven't connected the dots.

**`as const`** tells TypeScript to treat your object literally, not generically:

```ts
const flags = {
  darkMode: false,
  betaEditor: true,
  premiumFeature: false,
} as const;
// typeof flags = { readonly darkMode: false; readonly betaEditor: true; readonly premiumFeature: false }
```

**`keyof typeof`** derives a union from that literal:

```ts
type FlagKey = keyof typeof flags;
// "darkMode" | "betaEditor" | "premiumFeature"
```

Now you have your union type — and it's derived directly from the config. They can't diverge. Add a flag to the object, the type updates. Remove one, every stale usage breaks.

**Module aliases** (a Vite feature, also available in webpack) let you point an import path at a specific file:

```ts
// vite.config.ts
resolve: {
  alias: { '@app/flags': '/src/flags.config.ts' }
}
```

This is the piece that makes the pattern composable. A library can import from `@app/flags` and the *consumer's* config file is what actually gets loaded — including its types.

Put the three together and something interesting happens.

---

## The config file is the type definition

Here's the setup:

```ts
// your app: src/flags.config.ts
export const flags = {
  darkMode: false,
  betaEditor: true,
  premiumFeature: false,
} as const;
```

```ts
// library: derives a type from whatever the consumer's config exports
import type { flags } from '@app/flags';
export type FlagKey = keyof typeof flags;

export function useFlag(key: FlagKey): boolean {
  // ...
}
```

```ts
// your app: usage
useFlag('betaEditor')    // ✓
useFlag('premiumFeaure') // ✗ Argument of type '"premiumFeaure"' is not assignable to parameter of type '"darkMode" | "betaEditor" | "premiumFeature"'
```

The library never hardcodes your flag names. It imports your config through the alias and derives the types from it. When you add a flag, the type updates automatically. When you remove one, every stale callsite fails to compile.

No codegen. No CLI. No type engine. Your config file is already a type definition — you just needed a way to use it that way.

---

## A problem you can't solve from the library side

The flags example is clean because you own both sides — the config and the usage are in the same codebase. But there's a version of this problem that's harder: when you're a library author and your consumer's config doesn't exist yet.

Take a design system. You're building a `Button` component and you need to decide what `size` accepts. You have a few options:

**Option 1: Hardcode it.**
```ts
type ButtonSize = 'sm' | 'md' | 'lg';
```
Good for your own team. Terrible for everyone else. One team needs `xs` and `xl`. Another has a design system with exactly two sizes. A third one uses t-shirt sizes in Spanish. They all either adapt their design to your arbitrary choices or they fork the component.

**Option 2: Accept `string`.**
```ts
interface ButtonProps {
  size?: string;
}
```
Now anyone can pass anything. `"gigantic"` compiles fine. `"meduim"` compiles fine. You've made the component flexible and completely unsafe at the same time.

**Option 3: Generics.**
```ts
function Button<T extends string>({ size }: { size?: T }) { ... }
```
This preserves whatever type the caller passes, but it doesn't actually constrain to *valid* values. If the caller passes `"gigantic"`, TypeScript happily infers `T = "gigantic"`. You've just reflected the input type back, not validated against anything.

None of these are good. The real problem is that **the library author cannot know what values are valid** — that's the consumer's decision. So the type can't live in the library.

The module alias flips the dependency. Instead of the library defining the contract and the consumer conforming to it, the consumer defines their config and the library derives its types *from that*:

```ts
// library — types are derived from whatever the consumer exports
import type { yarcl } from '@yarcl/config';
type ButtonSize = keyof typeof yarcl.button.sizes;

// consumer A — two sizes
export const yarcl = { button: { sizes: { sm: '36px', lg: '52px' } } } as const;
// ButtonSize = "sm" | "lg"

// consumer B — five sizes
export const yarcl = { button: { sizes: { xs: '28px', sm: '36px', md: '44px', lg: '52px', xl: '60px' } } } as const;
// ButtonSize = "xs" | "sm" | "md" | "lg" | "xl"
```

Both consumers use the same library. Both get a `Button` component typed to *their* sizes. If consumer A tries `<Button size="xl" />` it's a TS error. If consumer B removes `xl` from their config, every usage breaks immediately.

The library author doesn't make the call. They just wire up the derivation.

But here's the part that makes this more than just type safety: **the consumer isn't picking from a pre-approved list — they're creating new design elements.**

Each entry in the config is a key and a value. The key becomes the type. The value is the actual pixel height the component renders at. So when a consumer adds a completely new size the library has never heard of, two things happen at once:

```ts
// consumer C — a fashion brand with their own sizing language
export const yarcl = {
  button: {
    sizes: {
      'talla-s':  '32px',
      'talla-m':  '44px',
      'talla-l':  '56px',
      'talla-xl': '68px',
    },
  },
} as const;
```

```tsx
<Button size="talla-xl" />  // ✓ — valid type AND renders at 68px
<Button size="lg" />        // ✗ — TS error, "lg" doesn't exist in this config
```

`talla-xl` is not something the library anticipated. There's no CSS class for it, no switch statement handling it, no entry in a lookup table. The component reads `yarcl.button.sizes['talla-xl']`, gets `'68px'`, and sets `--btn-h: 68px` as an inline style. The button renders at the right size automatically.

The design element is created from the config value. The type is derived from the config key. The library is just the mechanism connecting them.

Which means the library stops being a design system and becomes a **design system designer** — it doesn't tell you what your sizes are, it gives you the tools to define them yourself and enforces whatever you decide. Most component libraries give you a table of tokens and ask you to work within them. This inverts that: you bring the table, the library makes it work.

---

## It generalizes

I built this out for the design system case and then realized the same three primitives solve four completely different problems.

**Translations:**

```ts
export const translations = {
  en: { 'nav.home': 'Home', 'button.submit': 'Submit' },
  es: { 'nav.home': 'Inicio', 'button.submit': 'Enviar' },
} as const;

const { t } = useTranslation('en');
t('nav.home')  // ✓ "Home"
t('nav.hme')   // ✗ TS error
```

For context: i18next has TypeScript support, but it requires you to write a separate `.d.ts` file with module augmentation, import your JSON resources, and declare them in a `CustomTypeOptions` interface. It works, but it's a second file to maintain, and it only covers translations. This pattern covers everything with the same mechanism.

**Environment variables:**

```ts
export const envSchema = {
  VITE_API_URL: '',
  VITE_APP_NAME: '',
} as const;

env.VITE_API_URL  // ✓
env.VITE_TYPO     // ✗ TS error
```

Undeclared variables aren't accessible. Remove one from the schema and every usage breaks immediately, not at runtime when the value is `undefined` and something downstream explodes.

**Design tokens:**

```ts
export const yarcl = {
  button: {
    sizes: { xs: '28px', sm: '36px', md: '44px', lg: '52px' },
  },
  colors: { primary: '#2d4bb8', danger: '#dc2626' },
} as const;

<Button size="xs" color="primary" />  // ✓
<Button size="gigantic" />            // ✗ TS error
```

The consumer defines exactly how many sizes exist. Three colors? Two button sizes? Those become the only valid values. Nothing else compiles.

---

## What this actually is

The category of bug this eliminates is what I'd call a **configuration-contract violation**: your code assumes the config contains something, and nothing enforces that assumption.

Runtime validation (Zod, etc.) catches it when the app runs. Integration tests catch it if you've written the right test. Code review catches it if someone notices. This pattern catches it before you finish typing the line.

The interesting thing is that it's not a new technique — it's a new *connection* between techniques. `as const` is six years old. Module aliases have been in bundlers forever. `keyof typeof` is basic TypeScript. Nobody had put them together this way because each problem (flags, translations, env, design tokens) was being solved independently by dedicated tools, each with their own approach.

---

## Honest limitations

**It's currently Vite-only.** The plugin uses `resolve.alias`. A webpack adapter is straightforward — it's on the list. Next.js with Turbopack would need its own path.

**Libraries need to adopt it.** Right now, the typed hooks (`useFlag`, `useTranslation`, etc.) are in this repo. For this to be useful at scale, the actual libraries you use — LaunchDarkly, i18next, whatever your team uses for flags — would need to export config-aware typed APIs. Until that happens, the pattern requires either using this implementation or writing thin wrappers around your existing tools.

**It's a development-time guarantee, not a runtime one.** Types are erased at runtime. If your config changes between build and deploy, nothing catches it. Pair with runtime validation if you need that.

---

## Try it

The repo is at [github.com/your-handle/yarcl](https://github.com). Clone it, run `cd consumer && pnpm dev`, and then try adding a typo to any `useFlag`, `t()`, or `env.` call. The error shows up before you leave the line.

Then open `consumer/src/flags.config.ts` and add a new flag. It becomes valid immediately, with autocomplete, with no other changes.

That's the whole idea. The config file is already there. It might as well be the type definition too.
