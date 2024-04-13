---
author: Anubhav Gain
pubDatetime: 2023-12-01T01:42:00+05:30
modDatetime: 2023-12-01T01:42:00+05:30
title: 🦀 rusty install
slug: rust-installation
featured: true
draft: false
tags:
  - rust
description: installation of rust in windows/linux/mac.
---

  <img src="/assets/blog-images/rust.png" class="sm:w-1/2 mx-auto" alt="Anubhav Gain">

# Installing Rust on Your System

Rust is a powerful programming language known for its performance, reliability, and productivity. Whether you're a seasoned developer or just starting your programming journey, installing Rust on your system is the first step to unlocking its full potential. In this guide, we'll walk you through the process of installing Rust on Linux, macOS, and Windows.

## Steps to Install Rust

### 1. Install Rustup

Rustup is the official Rust installer and version management tool. It simplifies the process of installing and managing different versions of Rust.

- **Linux or macOS**: Open a terminal and enter the following command:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

- **Windows**: Download the installer from the [Rust website](https://www.rust-lang.org/tools/install) and follow the on-screen instructions.

### 2. Install Visual Studio C++ Build Tools

Rust requires certain C++ build tools to compile native dependencies. On Windows, you can either download the Microsoft C++ Build Tools or install Microsoft Visual Studio. Please note that the usage of these tools requires a valid Visual Studio license.

### 3. Install Rust

After installing Rustup and the C++ build tools, you can proceed to install Rust itself. Visit the [official Rust website](https://www.rust-lang.org/tools/install), and the website will detect your operating system and offer you the appropriate installer.

### 4. Install Visual Studio Code

Visual Studio Code (VS Code) is a popular text editor and integrated development environment (IDE) that provides excellent support for Rust development.

- **Install VS Code**: Download and install Visual Studio Code from the [official website](https://code.visualstudio.com/).
- **Install Extensions**:
  - **rust-analyzer**: This extension provides advanced language features for Rust development.
  - **CodeLLDB**: This extension adds debugging support for Rust projects.

### 5. Confirm Installation

To verify that Rust has been installed correctly, open a command prompt or terminal and type the following command:

```bash
cargo --version
```

If you see a version number printed on the screen, congratulations! You have successfully installed Rust on your system.

## Additional Resources

For more detailed instructions and troubleshooting tips, you can refer to the [official Rust installation guide](https://www.rust-lang.org/tools/install).

---

**Citations:**

- [MIT Rust Installation Guide](https://web.mit.edu/rust-lang_v1.25/arch/amd64_ubuntu1404/share/doc/rust/html/book/second-edition/ch01-01-installation.html)
- [Official Rust Documentation](https://doc.rust-lang.org/book/ch01-01-installation.html)
- [Microsoft Rust Setup Guide](https://learn.microsoft.com/en-us/windows/dev-environment/rust/setup)
- [Rust Installation Guide](https://www.rust-lang.org/tools/install)
- [Rust Getting Started Guide](https://www.rust-lang.org/learn/get-started)
