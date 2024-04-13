---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:45:00Z
modDatetime: 2024-04-13T08:45:00Z
title: From NeoVim to LunarVim
slug: from-neovim-to-lunarvim
featured: true
draft: false
tags:
  - neovim
  - lunarvim
  - ide
description: Guide for transitioning from NeoVim to LunarVim, an IDE layer for Neovim.
---

# From NeoVim to LunarVim

<img alt="Guangzhou, China" src="/assets/images/photo-kt443t6d_64hdh43hfh6dgjdfhg4_d-32dbeca90d3e5d2fc5dae0a82fcd32cc.jpg" width="1500" height="615">
<!-- TOC -->

## Installation

> **Prerequisites:**
>
> - Make sure you have installed the latest version of Neovim v0.9.0+.
> - Have git, make, pip, python, npm, node, and cargo installed on your system.

```bash
LV_BRANCH='release-1.3/neovim-0.9' bash <(curl -s https://raw.githubusercontent.com/LunarVim/LunarVim/release-1.3/neovim-0.9/utils/installer/install.sh)
```

Optional:

```bash
sudo npm install -g neovim tree-sitter-cli
pip install pynvim
```

## Updating LunarVim

Inside LunarVim `:LvimUpdate`

Updating Plugins inside LunarVim `:LvimSyncCorePlugins`

From the command-line `lvim +LvimUpdate +q`

## Post install

LunarVim uses icons from Nerd Fonts. If you don't want to use them, set `lvim.use_icons` to `false`.

```bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts && curl -fLO https://github.com/ryanoasis/nerd-fonts/raw/HEAD/patched-fonts/DroidSansMono/DroidSansMNerdFont-Regular.otf
```

After installing your font, refresh your font cache:

```bash
fc-cache -f -v
```

## Cheat Sheet

### Keybinds

**Exiting:**

- `:q`: Close file
- `:qa`: Close all files
- `:w`: Save
- `:wq` / `:x`: Save and close file
- `ZZ`: Save and quit
- `ZQ`: Quit without checking changes

**Navigating:**

- `h j k l`: Arrow keys
- `<C-U>` / `<C-D>`: Half-page up/down
- `<C-B>` / `<C-F>`: Page up/down
- `0`: Start of line
- `$`: End of line
- `b / w`: Previous/next word
- `ge / e`: Previous/next end of word

**Line:**

- `^`: Start of line (after whitespace)

**Document:**

- `gg`: First line
- `G`: Last line
- `:{number}`: Go to line {number}
- `{`: Jump to beginning of paragraph
- `}`: Jump to end of paragraph

**Operators:**

- `d`: Delete
- `w`: Motion
- `y`: Yank (copy)
- `c`: Change (delete then insert)
- `>`: Indent right
- `<`: Indent left
- `=`: Autoindent
- `u`: Undo
- `<C-R>`: Redo

### Configuration

You can configure LunarVim by using the configuration file located in:

```lua
cat ~/.config/lvim/config.lua
```

[Read the docs](https://www.lunarvim.org/docs/configuration)

### Custom Keybinds

```lua
-- Move selected line with K or J
vim.keymap.set("v", "K",  ":m '\<-2\<cr\>gv=gv")
vim.keymap.set("v", "J",  ":m '\>+1\<cr\>gv=gv")

-- Scroll with ctrl-d and ctrl-j while keeping centered
vim.keymap.set("n", "\<C-d\>",  "\<C-d\>zz")
vim.keymap.set("n", "\<C-u\>",  "\<C-u\>zz")

-- Find next with n and N while keeping centered
vim.keymap.set("n", "n",  "nzzzv")
vim.keymap.set("n", "N",  "Nzzzv")

-- Use system clipboard when copying with SPACE+y
-- You may need to install xclip (X11) or wl-clipboard (wayland)
vim.keymap.set("n", "\<leader\>y", "\"+y")
vim.keymap.set("v", "\<leader\>y", "\"+y")
vim.keymap.set("n", "\<leader\>Y", "\"+Y")
```

### Python

Configure LunarVim for Python development:

```lua
lvim.builtin.treesitter.ensure_installed = {
  "python",
}
```

```lua
local formatters = require "lvim.lsp.null-ls.formatters"
formatters.setup { { name = "black" }}
lvim.format_on_save.enabled = true
lvim.format_on_save.pattern = { "*.py" }
```

```lua
local linters = require "lvim.lsp.null-ls.linters"
linters.setup { { command = "flake8", args = { "--ignore=E

203" }, filetypes = { "python" } } }
```

<img alt="From NeoVim to LunarVim" src="/assets/images/LunarVim_01-1a48122367f6e72d425ad5d14669115a.png" width="1110" height="578">

<!-- Further, there are two plugins that come recommended - one for switching virtual environments and an eye-candy one:

```lua
lvim.plugins = {
  "ChristianChiarulli/swenv.nvim",
  "stevearc/dressing.nvim",
}

require('swenv').setup({
  post_set_venv = function()
    vim.cmd("LspRestart")
  end,
})

lvim.builtin.which_key.mappings["C"] = {
  name = "Python",
  c = { "\<cmd\>lua require('swenv.api').pick_venv()\<cr\>", "Choose Env" },
}
```

The two configurations below the plugin block make sure that the language server is restarted after switching to a new Python virtual environment and that typing `SPACE + C` opens a dialogue you can select your environment from.

Hmmm - switching environments does not work for me - the dialogue does not open. I will have to check later what the issue is. -->

## Other

```bash
:TSInstall json
:TSInstall javascript
:TSInstall typescript
:TSInstall tsx
```

```lua
--move selected line with K or J
vim.keymap.set("v", "K",  ":m '\<-2\<cr\>gv=gv")
vim.keymap.set("v", "J",  ":m '\>+1\<cr\>gv=gv")

--scroll with ctrl-d and ctrl-j while keeping centered
vim.keymap.set("n", "\<C-d\>",  "\<C-d\>zz")
vim.keymap.set("n", "\<C-u\>",  "\<C-u\>zz")

--find next with n and N while keeping centered
vim.keymap.set("n", "n",  "nzzzv")
vim.keymap.set("n", "N",  "Nzzzv")

--use system clipboard when copying with SPACE+y
--you may need to install xclip (X11) or wl-clipboard (wayland)
vim.keymap.set("n", "\<leader\>y", "\"+y")
vim.keymap.set("v", "\<leader\>y", "\"+y")
vim.keymap.set("n", "\<leader\>Y", "\"+Y")
```

```lua
lvim.builtin.treesitter.ensure_installed = {
  "json",
  "javascript",
  "typescript",
  "tsx",
}
```
