---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:30:00Z
title: "Complete ZSH Setup for Arch Linux with Security Tools"
slug: arch-linux-zsh-setup
featured: false
draft: false
tags:
  - arch-linux
  - zsh
  - security
  - shell
  - automation
description: "A comprehensive automated script to set up a fully configured ZSH environment on Arch Linux with security-focused settings and modern CLI tools."
---

## Table of Contents

## Introduction

This guide provides a complete automated script for setting up ZSH (Z Shell) on Arch Linux with Oh My Zsh, essential plugins, security tools, and modern CLI enhancements. The script is designed with security professionals in mind, including tools for system auditing, vulnerability scanning, and secure configurations.

## Features

The script includes:

- Oh My Zsh installation with optimized configuration
- Essential ZSH plugins for productivity
- Security-focused tools and aliases
- Modern CLI replacements (exa, bat, fd, ripgrep)
- Automatic security checks and configurations
- Optional Rust installation with security tools
- Firewall setup with UFW
- System auditing tools (lynis, rkhunter)

## The Complete Setup Script

Here's the full script that automates the entire setup process:

```bash
#!/bin/bash
# Complete ZSH Setup Script for Arch Linux
# This script will set up a fully configured ZSH environment with security-focused settings

# Exit on error
set -e

# Step 1: Update system and install required packages
echo "Updating system and installing required packages..."
sudo pacman -Syu --noconfirm
sudo pacman -S --needed --noconfirm zsh git curl wget unzip

# Step 2: Install Oh My Zsh
echo "Installing Oh My Zsh..."
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Step 3: Install zsh plugins
echo "Installing ZSH plugins..."
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions
git clone https://github.com/zdharma-continuum/history-search-multi-word ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/history-search-multi-word

# Step 4: Create a new .zshrc file with optimized configuration
echo "Configuring .zshrc..."
cat > ~/.zshrc << 'EOL'
# Path to your oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Set theme
ZSH_THEME="robbyrussell"

# Set plugins
plugins=(
  git
  archlinux
  zsh-autosuggestions
  zsh-syntax-highlighting
  zsh-completions
  history-search-multi-word
  sudo
  systemd
  rust
)

# Load Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Load auto-completion
autoload -Uz compinit
compinit

# Enhanced completion configuration
zstyle ':completion:*' menu select
zstyle ':completion:*' completer _expand _complete _ignored _approximate
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' verbose yes
zstyle ':completion:*:descriptions' format '%B%d%b'
zstyle ':completion:*:messages' format '%d'
zstyle ':completion:*:warnings' format 'No matches for: %d'
zstyle ':completion:*:corrections' format '%B%d (errors: %e)%b'
zstyle ':completion:*' group-name ''

# Command auto-correction
setopt correct

# Security-focused history configuration
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt appendhistory
setopt sharehistory
setopt incappendhistory
setopt hist_ignore_all_dups
setopt hist_save_no_dups
setopt hist_ignore_space  # Don't save commands starting with space
setopt hist_verify        # Show command with history expansion before executing

# Autosuggestion settings
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=8"
bindkey '^ ' autosuggest-accept  # Ctrl+Space to accept suggestion

# Security-focused aliases
alias checkrootkits="sudo rkhunter --check"
alias listports="sudo ss -tulpn"
alias psall="ps auxf"
alias sctl="sudo systemctl"
alias jctl="sudo journalctl"
alias firewall="sudo ufw status verbose"
alias updatesystem="sudo pacman -Syu"
alias orphans="pacman -Qtdq"
alias clearpkgcache="sudo pacman -Sc"

# Enhanced path completion
zstyle ':completion:*' special-dirs true

# Case-insensitive completion
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'

# Fix slow paste in zsh
pasteinit() {
  OLD_SELF_INSERT=${${(s.:.)widgets[self-insert]}[2,3]}
  zle -N self-insert url-quote-magic
}
pastefinish() {
  zle -N self-insert $OLD_SELF_INSERT
}
zstyle :bracketed-paste-magic paste-init pasteinit
zstyle :bracketed-paste-magic paste-finish pastefinish

# Secure file permissions for sensitive files
chmod 700 ~/.ssh 2>/dev/null || true
chmod 600 ~/.ssh/id_* 2>/dev/null || true
chmod 644 ~/.ssh/*.pub 2>/dev/null || true
chmod 600 ~/.netrc 2>/dev/null || true

# Rust cargo bin path
if [ -d "$HOME/.cargo/bin" ]; then
  export PATH="$HOME/.cargo/bin:$PATH"
fi

# Enable GPG agent for SSH if available
if [ -f "${HOME}/.gnupg/gpg-agent.conf" ]; then
  export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
  gpgconf --launch gpg-agent
fi
EOL

# Step 5: Install additional helpful tools
echo "Installing additional tools..."
sudo pacman -S --needed --noconfirm exa bat fd ripgrep fzf htop lynis rkhunter ufw base-devel

# Step 6: Add additional tool configurations to .zshrc
cat >> ~/.zshrc << 'EOL'

# Modern command line tools
if command -v exa > /dev/null; then
  alias ls="exa"
  alias ll="exa -l"
  alias la="exa -la"
  alias lt="exa -la --tree --level=2"
fi

if command -v bat > /dev/null; then
  alias cat="bat"
fi

if command -v fd > /dev/null; then
  alias find="fd"
fi

if command -v rg > /dev/null; then
  alias grep="rg"
fi

# Enable fzf keybindings and completion
if [ -f /usr/share/fzf/key-bindings.zsh ]; then
  source /usr/share/fzf/key-bindings.zsh
fi

if [ -f /usr/share/fzf/completion.zsh ]; then
  source /usr/share/fzf/completion.zsh
fi

# Useful shortcuts
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."

# Security checks
alias checksec="lynis audit system"
alias vulnerabilities="~/security-check.sh"

# Show network connections
alias netstat="netstat -tulanp"

# Check for ssh brute force attempts
alias sshbrutecheck="grep 'Failed password' /var/log/auth.log | awk '{print \$11}' | sort | uniq -c | sort -nr"

# Set up UFW firewall if installed
if command -v ufw > /dev/null; then
  # Check if UFW is active
  if ! systemctl is-active --quiet ufw; then
    echo "Firewall (UFW) is not active. Consider enabling it with: sudo ufw enable"
  fi
fi

# Warn if running as root
if [[ $EUID -eq 0 ]]; then
  echo "WARNING: You are running as root. This is not recommended."
fi
EOL

# Step 7: Install alternative security tools instead of arch-audit
echo "Installing alternative security tools..."
sudo pacman -S --needed --noconfirm arch-audit-gtk pacutils

# Create a security checking script
cat > ~/security-check.sh << 'EOL'
#!/bin/bash
# Security check script for Arch Linux

echo "===== Running security checks ====="
echo
echo "1. Checking for out-of-date packages..."
pacman -Qu
echo
echo "2. Checking for orphaned packages..."
pacman -Qtdq
echo
echo "3. Checking running services..."
systemctl list-units --type=service --state=running
echo
echo "4. Checking open ports..."
ss -tuln
echo
echo "5. Checking recent authentication failures..."
journalctl -u sshd --since "24 hours ago" | grep "Failed password"
echo
echo "6. Running lynis quick scan..."
sudo lynis audit system --quick
EOL

chmod +x ~/security-check.sh

# Step 8: Configure basic UFW rules
if command -v ufw > /dev/null; then
  echo "Setting up basic UFW firewall rules..."
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  echo "You may want to enable the firewall with: sudo ufw enable"
fi

# Step 9: Install Rust if requested
read -p "Do you want to install Rust? (y/n) " install_rust
if [[ $install_rust =~ ^[Yy]$ ]]; then
  echo "Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source $HOME/.cargo/env

  # Install some useful Rust security tools
  cargo install cargo-audit
  cargo install cargo-crev
  cargo install cargo-outdated

  # Add Rust security aliases
  cat >> ~/.zshrc << 'EOL'

# Rust security aliases
alias rust-audit="cargo audit"
alias rust-outdated="cargo outdated"
alias rust-update="cargo update"
alias rust-crev="cargo crev"
EOL
fi

# Step 10: Make ZSH the default shell
if [[ $SHELL != *"zsh"* ]]; then
  echo "Setting ZSH as the default shell..."
  chsh -s $(which zsh)
fi

# Step 11: Final instructions instead of sourcing
echo "Configuration created successfully!"
echo "To apply the new configuration, either:"
echo "1. Start a new terminal session, or"
echo "2. Run the command: exec zsh"

echo "✅ ZSH setup complete!"
echo "Your terminal has been configured with security-focused settings."
echo "If you don't see the changes immediately, please restart your terminal."
echo ""
echo "Security Tools Installed:"
echo "- rkhunter: Rootkit detection"
echo "- lynis: Security auditing"
echo "- ufw: Uncomplicated Firewall"
echo "- security-check.sh: Custom security checking script"
if [[ $install_rust =~ ^[Yy]$ ]]; then
  echo "- cargo-audit: Audit Rust dependencies for vulnerabilities"
  echo "- cargo-crev: Rust code review system"
fi
echo ""
echo "Type 'checksec' to run a security audit of your system"
```

## Key Features Explained

### Oh My Zsh Plugins

The script installs and configures several essential plugins:

- **zsh-autosuggestions**: Suggests commands as you type based on history
- **zsh-syntax-highlighting**: Provides syntax highlighting for commands
- **zsh-completions**: Additional completion definitions
- **history-search-multi-word**: Multi-word history searching

### Security Tools

The script includes several security-focused tools:

- **lynis**: System security auditing tool
- **rkhunter**: Rootkit scanner
- **ufw**: Uncomplicated Firewall for easy firewall management
- **Custom security script**: Automated security checks

### Modern CLI Tools

Replaces traditional Unix commands with modern alternatives:

- **exa**: A modern replacement for `ls`
- **bat**: A cat clone with syntax highlighting
- **fd**: A simple, fast alternative to `find`
- **ripgrep**: A faster alternative to `grep`
- **fzf**: Fuzzy finder for command-line

### Security Aliases

The script creates useful security-focused aliases:

```bash
alias checkrootkits="sudo rkhunter --check"
alias listports="sudo ss -tulpn"
alias firewall="sudo ufw status verbose"
alias checksec="lynis audit system"
```

## Usage Instructions

1. Save the script to a file (e.g., `setup-zsh.sh`)
2. Make it executable: `chmod +x setup-zsh.sh`
3. Run the script: `./setup-zsh.sh`
4. Restart your terminal or run `exec zsh`

## Post-Installation

After running the script:

1. **Enable the firewall**: `sudo ufw enable`
2. **Run a security audit**: `checksec`
3. **Check for vulnerabilities**: `~/security-check.sh`
4. **Configure additional firewall rules** as needed

## Customization

You can customize the script by:

- Changing the ZSH theme in the `.zshrc` file
- Adding more plugins to the plugins array
- Installing additional security tools
- Modifying aliases to suit your workflow

## Troubleshooting

If you encounter issues:

1. **ZSH not loading**: Ensure ZSH is set as your default shell with `chsh -s $(which zsh)`
2. **Plugins not working**: Check if they were cloned correctly in `~/.oh-my-zsh/custom/plugins/`
3. **Permission issues**: Run the script with proper user permissions (not as root unless necessary)

## Security Considerations

The script implements several security best practices:

- Secure file permissions for SSH keys and sensitive files
- History configuration that ignores commands starting with space
- GPG agent integration for SSH if available
- Warning when running as root
- Automatic security tool installation and configuration

## Conclusion

This automated setup provides a powerful, security-focused ZSH environment on Arch Linux. It combines productivity enhancements with security tools, making it ideal for developers, system administrators, and security professionals. The modern CLI tools and comprehensive plugin setup ensure an efficient and enjoyable command-line experience.
