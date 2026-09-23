---
author: Eugene Yakhnenko
pubDatetime: 2026-06-17T12:00:00Z
title: "I built a terminal IDE that feels like VS Code: here's why"
slug: terminal-ide-feels-like-vscode
featured: false
tags:
  - go
  - ttt
  - terminal
  - ide
description: "TTT is a terminal-native IDE written in Go with standard keybindings, LSP support, and a familiar GUI feel, built so you never have to leave the terminal."
---

If you're using terminal-based AI agents like Claude Code, you're already living in the terminal. But every time you need to review code, check a PR, or search across your codebase, you switch back to VS Code. Every switch costs context.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xffrhl4l9adzoqbwik9k.gif)

Vim and Neovim solved terminal-native editing a long time ago. But modal editing is a wall. Most developers try it, struggle with it, and go back to what feels familiar.

So the choice has been: stay in the terminal and learn a new paradigm, or use a familiar IDE and accept the context switching.

I didn't think that tradeoff should exist.

## What is TTT?

TTT is a terminal text editor written in Go. Single binary, zero config. But the key decision was this: it should look and feel like VS Code or Zed — not like a terminal editor.

That means:

- **Standard keybindings** — Ctrl+C, Ctrl+V, Ctrl+Z. No modes to learn.
- **Command palette** — Ctrl+P to find files, run commands, switch themes.
- **Sidebar panels** — file explorer, search results, git changes. Click to navigate.
- **Mouse support** — click, drag, select. Right-click context menus.
- **Tabs** — open multiple files, switch between them.
- **Menus** — a full menu bar, just like a GUI editor.

It's not a "terminal editor that's trying its best." It's an IDE that happens to run in your terminal.

## Features

**LSP support** — completions, diagnostics, hover, go-to-definition, references, rename, code actions, signature help. Same Language Server Protocol that powers VS Code, running over JSON-RPC/stdio.

**Integrated terminal** — a full terminal emulator inside the editor with 256-color support. Run your builds, tests, and git commands without leaving.

**GitHub PR review** — open a pull request URL from the command palette and review diffs inline. Navigate between changed files without leaving the editor.

**Project-wide search** — powered by ripgrep. Search across your entire codebase with debounced input and result navigation.

**Git integration** — stage, unstage, commit, push, pull. View changes, open diffs, git gutter indicators in the editor.

**Themes** — multiple built-in themes with live preview when switching. The editor looks good out of the box.

**Code intelligence** — syntax highlighting, code folding, bracket pair colorization, matching bracket navigation, indent detection, EditorConfig support.

## Why not just use Vim/Neovim?

Nothing against them. They're powerful, mature, and have massive ecosystems. But they require you to rewire your muscle memory. Modal editing is a fundamentally different interaction model, and for developers who've spent years in VS Code or Sublime, that's a real barrier.

TTT's position is simple: you shouldn't have to choose between a familiar UX and staying in the terminal.

## Why not VS Code in the terminal?

VS Code's remote/terminal options exist, but they're still VS Code — an Electron app connecting to your terminal, not a native terminal application. The distinction matters when you want something that starts instantly, runs alongside your tools, and stays within the same context as your terminal workflow.

## The AI agent angle

This is the part that motivated the project. When you're pair-programming with a terminal-based AI agent, your workflow lives in the terminal. The agent runs commands, edits files, runs tests — all in the terminal. If your editor also lives there, you never leave. You can review what the agent changed, search the codebase for context, open a PR diff — all without switching windows.

Your agent works. You review. Same context, same window.

## Try it

TTT is a single Go binary with zero runtime dependencies.

**macOS:**

```sh
brew tap eugenioenko/ttt
brew install ttt
```

**Linux:**

```sh
curl -fsSL https://raw.githubusercontent.com/eugenioenko/ttt/main/install.sh | bash
```

**From source:**

```sh
git clone https://github.com/eugenioenko/ttt.git
cd ttt
make build
./bin/ttt .
```

- Site: [tttedit.dev](https://tttedit.dev)
- Source: [github.com/eugenioenko/ttt](https://github.com/eugenioenko/ttt)

Feedback welcome — especially from developers who've tried terminal editors before and bounced off them.
