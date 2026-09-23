---
author: Eugene Yakhnenko
pubDatetime: 2026-06-27T12:00:00Z
title: "From 'I Can't Click' to a Full Testing Harness: How We Built Playwright for the Terminal"
slug: playwright-for-the-terminal
featured: false
tags:
  - go
  - testing
  - ttt
  - cli
description: "How a frustrating limitation in TUI testing led to building a scripted interaction system that lets AI agents drive a terminal editor like Playwright drives a browser."
---

I'm building [TTT](https://tttedit.dev) -- a terminal text editor and IDE written in Go. Single binary, zero config, runs anywhere. Think VS Code but in your terminal. It has syntax highlighting, LSP integration, a plugin system, an integrated terminal, git integration, etc...

The [source is on GitHub](https://github.com/eugenioenko/ttt) and I develop it with Claude Code as my pair programmer. This is the story of how a frustrating limitation turned into something genuinely useful: a built-in scripted interaction system that lets AI agents (or anyone) drive the editor like Playwright drives a browser.

## The problem

I was deep in revamping the widget system and building out a Lua plugin API. Phases of work stacking up -- widget rendering, panel support, tree views, input fields, command registration, keybinding hooks. The kind of work where you need to _see_ what's happening. Click a tree node, check if it expands. Open a panel, verify focus moves correctly. Run a plugin, confirm the dialog appears.

Here's the thing: Claude Code can run shell commands and read files. It cannot interact with a live TUI session. The editor launches, takes over the terminal, and that's it -- Claude is blind.

## Step 1: tui-use (what we had)

The project already had functional tests using [tui-use](https://github.com/onesuper/tui-use), a JavaScript library that drives a real terminal binary. It can type, press keys, wait for text to appear, and take snapshots:

```javascript
const tui = await start("bin/ttt", ["test-file.go"]);
await tui.waitFor("test-file.go");
await tui.exec("editor.joinLines");
const screen = await tui.snapshot();
expect(screen).toContain("joined line");
```

This works. But it's slow -- each test spawns the binary, waits for screen renders, polls with timeouts, and parses terminal escape codes. And critically, **it can't click**. Mouse events aren't supported. For a widget system with tree views, buttons, and split panels, that's a dealbreaker.

## Step 2: Debug commands (the workaround)

So we added a `Debug: Simulate Click` command to the editor itself. Open the command palette, type coordinates, it fires a synthetic mouse event. Problem solved? Kind of. Claude still can't drive a live session to use it.

But it planted a seed: the editor can simulate its own input.

## Step 3: Lua as a test harness

TTT has a Lua plugin system. Plugins can register panels, commands, keybindings, and interact with the editor through a `ttt` module. We added `ttt.click(x, y)` directly to the Lua API:

```lua
local ttt = require("ttt")
ttt.click(10, 5)
```

Then `ttt.screenshot(path)` to dump the screen to a file, and `ttt.debug(path)` to dump the full internal state -- widget tree, focus, selection, panels, cursor position -- as JSON.

Now a Lua script could interact with the editor and capture results to files that Claude can read:

```lua
local ttt = require("ttt")
ttt.click(10, 5)
ttt.screenshot("/tmp/after-click.txt")
ttt.debug("/tmp/state.json")
ttt.quit()
```

We added a `--plugin` CLI flag to load a Lua file on startup, and `--size WxH` to force deterministic screen dimensions:

```bash
bin/ttt --plugin test.lua --size 120x40
cat /tmp/after-click.txt
cat /tmp/state.json
```

This was a breakthrough. Claude could now write a Lua script, run the editor, and inspect the results. But writing a Lua file for every quick check felt heavy.

## Step 4: --exec (the final form)

The insight: most debugging interactions are simple sequences. Click here, press that key, take a screenshot. Why write a file?

We added `--exec`, which takes a semicolon-separated string of commands:

```bash
bin/ttt --size 120x40 --exec "wait 200; screenshot /tmp/s1.txt; click 10 5; wait 100; screenshot /tmp/s2.txt; quit"
```

The supported commands:

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `click X Y`       | Simulate a mouse click                          |
| `key COMBO`       | Simulate a key press (`ctrl+p`, `enter`, etc.)  |
| `type TEXT`       | Type a string character by character            |
| `exec "Command"`  | Run a command by title                          |
| `screenshot PATH` | Dump screen text to a file                      |
| `debug PATH`      | Dump full state JSON (widget tree, focus, etc.) |
| `wait MS`         | Wait milliseconds                               |
| `quit`            | Exit                                            |

Now Claude can do this in a single bash command:

```bash
bin/ttt --size 120x40 file.go --exec "wait 200; screenshot /tmp/screen.txt; debug /tmp/state.json; quit" && cat /tmp/screen.txt
```

And instantly see what's on screen. No Lua file, no polling, no escape codes. Build, run, inspect -- milliseconds, not seconds.

## What the debug dump looks like

The `debug` command captures everything you'd want to assert on:

```json
{
  "screen": { "width": 120, "height": 40 },
  "cursor": { "line": 5, "col": 10 },
  "buffer": { "path": "file.go", "lines": 42, "modified": false },
  "focus": "editor",
  "sidebar": {
    "visible": true,
    "active": "explorer",
    "panels": ["explorer", "search", "changes"]
  },
  "bottom_panel": { "visible": false, "active": "output" },
  "tabs": [{ "path": "file.go", "modified": false }],
  "selection": { "active": false },
  "output": [],
  "widget_tree": {
    "type": "VStack",
    "rect": { "x": 0, "y": 0, "w": 120, "h": 40 },
    "children": [
      {
        "type": "MenuBar",
        "rect": { "x": 0, "y": 0, "w": 120, "h": 1 }
      },
      {
        "type": "SplitPanel",
        "props": { "show_left": true, "divider_pos": 30 },
        "children": [
          {
            "type": "Sidebar",
            "props": { "visible": true, "active": "explorer" },
            "children": [
              {
                "type": "Tree",
                "props": { "items": 12, "selected": 3 },
                "focused": true
              }
            ]
          }
        ]
      }
    ]
  }
}
```

The screenshot gives you the text. The debug dump gives you the state. Between the two, you can verify anything -- layout, focus, widget hierarchy, selection, which panel is active, how many items are in a tree.

## The progression

Looking back, each step was small but unlocked something the previous couldn't:

1. **tui-use** -- keyboard-only blackbox testing, slow, no mouse
2. **Debug: Simulate Click** -- mouse support, but only through command palette
3. **ttt.click()** in Lua -- programmatic mouse, but requires writing a plugin file
4. **ttt.screenshot() + ttt.debug()** -- capture both visual and internal state
5. **--exec** -- one-liner scripted interaction, no files needed

What started as "I can't click in tests" ended up as a general-purpose testing and debugging harness that's faster than Playwright, gives deeper insight (you get the widget tree, not just pixels), and works for both AI agents and human developers.

## Using it for real

The PR that adds all of this: [feat/debug-commands #274](https://github.com/eugenioenko/ttt/pull/274)

The immediate use case: I'm working through an audit of the plugin and widget system. Dozens of items to fix -- tree expand ordering, box padding, focus management, API consistency. For each fix, I can now:

1. Write the fix
2. `bin/ttt --size 120x40 --exec "wait 200; debug /tmp/state.json; quit"`
3. Assert on the state
4. Move on

No test file to maintain. No polling. No flaky waits. Just build, run, check.

## Try it

TTT is open source and available at [tttedit.dev](https://tttedit.dev). Install it, open a file, run `Debug: Dump State` from the command palette, and look at the JSON. The full widget tree is right there.

If you're building a TUI application and struggling with testing, consider this pattern: expose your internal state through a debug dump, add a scripted command interface, and let your tools (AI or otherwise) drive it programmatically. It's surprisingly little code for a lot of capability.
