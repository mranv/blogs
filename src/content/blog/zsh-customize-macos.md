---
author: Anubhav Gain
pubDatetime: 2025-01-28T18:25:00Z
title: Customizing Zsh with Oh-My-Zsh on macOS ARM M1
slug: "zsh-customize-macos"
featured: false
draft: false
tags:
  - macos
  - zsh
  - terminal
  - productivity
  - devtools
description: A comprehensive guide to installing and configuring oh-my-zsh with essential plugins for DevSecOps workflows on macOS ARM M1.
---

## Table of contents

## Install oh-my-zsh

```bash
# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## Essential plugins for DevSecOps workflow

```bash
# Clone popular plugins to custom plugins directory
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions
```

## Configure .zshrc

Edit `~/.zshrc` and update the plugins line:

```bash
plugins=(
  git
  docker
  kubectl
  aws
  terraform
  rust
  brew
  macos
  zsh-autosuggestions
  zsh-syntax-highlighting
  zsh-completions
)
```

## Apply configuration

```bash
# Reload configuration
source ~/.zshrc

# Or restart terminal
exec zsh
```

## Optional: PowerLevel10k theme (performance-optimized)

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

Set `ZSH_THEME="powerlevel10k/powerlevel10k"` in `.zshrc`, then run `p10k configure`.

The selected plugins provide Git integration, cloud tool completions, syntax highlighting, and intelligent autosuggestions—particularly useful for security tooling and infrastructure management workflows.
