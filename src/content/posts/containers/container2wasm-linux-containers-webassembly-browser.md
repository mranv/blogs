---
title: "container2wasm: Running Existing Linux Containers on WebAssembly Without Modification"
slug: "container2wasm-linux-containers-webassembly-browser"
author: "Anubhav Gain"
pubDatetime: 2025-08-02T11:00:00Z
featured: true
draft: false
tags:
  - webassembly
  - wasm
  - containers
  - docker
  - linux
  - virtualization
  - browser
  - bochs
  - tinyemu
  - wasi
category: DevOps
description: "Explore container2wasm, an innovative converter that enables running unmodified Linux containers on WebAssembly by leveraging CPU emulation, supporting both x86_64 and RISC-V architectures in browsers and WASI runtimes."
---

# container2wasm: Running Existing Linux Containers on WebAssembly

## Introduction

While WebAssembly adoption continues to grow, porting existing applications remains a significant challenge. Enter container2wasm - an experimental project from NTT that takes a radically different approach: instead of recompiling applications for WebAssembly, it converts entire Linux containers to run on WASM through CPU emulation. This innovative solution bridges the gap between existing containerized applications and the WebAssembly ecosystem.

## The Challenge of WebAssembly Adoption

### Traditional Porting Limitations

Porting applications to WebAssembly typically requires:

- Recompiling source code with WASM-compatible toolchains
- Reimplementing platform-dependent code
- Adapting to WASM's sandboxed environment
- Dealing with missing kernel APIs
- Significant development time and effort

### The container2wasm Solution

Rather than requiring application modifications, container2wasm converts entire container images - including the Linux kernel - to run on WebAssembly. This approach enables:

- Zero modification of existing applications
- Support for any Linux-based container
- Preservation of existing workflows
- Immediate WebAssembly compatibility

## How container2wasm Works

### Architecture Overview

The converter creates a WASM image containing:

1. **CPU Emulator**: Bochs (x86_64) or TinyEMU (RISC-V) compiled to WebAssembly
2. **Guest Linux Kernel**: Full Linux kernel running on the emulated CPU
3. **Container Runtime**: runc for container management
4. **Original Container**: Unmodified container image and applications

### Technical Stack

#### Build Process

- **BuildKit**: Orchestrates the conversion steps via Dockerfile
- **wasi-sdk**: Compiles emulators for WASI targets
- **Emscripten**: Compiles for browser targets
- **wasi-vfs**: Packages dependencies for WASI
- **wizer**: Pre-initializes emulator for faster startup

#### Runtime Components

- **CPU Emulation**:
  - Bochs for x86_64 containers (since v0.3.0)
  - TinyEMU for RISC-V containers
  - QEMU for additional architectures (with performance penalty)

- **Filesystem Access**:
  - WASI filesystem API for host directory mapping
  - virtio-9p for guest Linux mounting
  - Full read/write capabilities

- **Container Management**:
  - Standard runc container runtime
  - Full OCI container support
  - Process isolation within emulated environment

## Getting Started with container2wasm

### Prerequisites

- Docker with BuildKit support
- Docker Buildx v0.8+ (recommended)
- c2w command from official releases

### Basic Usage

#### Converting to WASI

Convert an x86_64 Ubuntu container:

```bash
$ c2w ubuntu:22.04 out.wasm
$ wasmtime out.wasm uname -a
Linux localhost 6.1.0 #1 Wed Feb 15 04:09:09 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
```

Convert a RISC-V container:

```bash
$ c2w riscv64/ubuntu:22.04 out.wasm
$ wasmtime out.wasm uname -a
Linux localhost 6.1.0 #1 Wed Feb 15 04:09:09 UTC 2023 riscv64 riscv64 riscv64 GNU/Linux
```

#### Directory Sharing

Share host directories with the container:

```bash
$ mkdir -p /tmp/share/ && echo "Hello from host" > /tmp/share/greeting
$ wasmtime --mapdir /container/share::/tmp/share -- out.wasm \
    --entrypoint=cat -- /container/share/greeting
Hello from host
```

#### Browser Deployment

Generate browser-compatible assets:

```bash
$ c2w --to-js ubuntu:22.04 /tmp/out-js/htdocs/
```

Serve with Apache:

```bash
$ cp -R ./examples/emscripten/* /tmp/out-js/
$ docker run --rm -p 8080:80 \
    -v "/tmp/out-js/htdocs:/usr/local/apache2/htdocs/:ro" \
    -v "/tmp/out-js/xterm-pty.conf:/usr/local/apache2/conf/extra/xterm-pty.conf:ro" \
    --entrypoint=/bin/sh httpd -c \
    'echo "Include conf/extra/xterm-pty.conf" >> /usr/local/apache2/conf/httpd.conf && httpd-foreground'
```

## Real-World Examples

### Development Environments

Run full development stacks in the browser:

```bash
# Python development environment
$ c2w python:3.11-alpine python-dev.wasm
$ wasmtime python-dev.wasm python --version
Python 3.11.x

# Node.js environment
$ c2w node:18-alpine node-dev.wasm
$ wasmtime node-dev.wasm node --version
v18.x.x
```

### Legacy Application Support

Run legacy applications without modification:

```bash
# Legacy database tools
$ c2w legacy/mysql-client:5.6 mysql-tools.wasm

# Old build environments
$ c2w centos:6 legacy-build.wasm
```

### Educational Use Cases

Provide safe, sandboxed Linux environments:

```bash
# Linux learning environment
$ c2w alpine:latest learn-linux.wasm
$ wasmtime learn-linux.wasm sh
/ # ls /proc
/ # ps aux
```

## Performance Considerations

### Architecture Impact

Performance varies significantly by architecture:

- **x86_64**: Native performance with Bochs emulation
- **RISC-V**: Good performance with TinyEMU
- **Other architectures**: Additional QEMU layer impacts performance

### Optimization Strategies

1. **Choose appropriate base images**:
   - Prefer x86_64 or RISC-V base images
   - Use minimal distributions (Alpine, distroless)

2. **Pre-initialization with wizer**:
   - Reduces startup time
   - Available for WASI targets only

3. **Image size optimization**:
   - Remove unnecessary packages
   - Use multi-stage builds
   - Minimize filesystem layers

### Typical Image Sizes

- Alpine-based: 70-90MB
- Debian slim: 130-200MB
- Ubuntu: 200-300MB
- Full development environments: 300-500MB

## Networking Support

Since version 0.5, container2wasm supports networking:

- TCP/IP stack within emulated environment
- Port forwarding capabilities
- Network isolation from host
- Support for containerized network applications

## Comparing Approaches: container2wasm vs WasmLinux

### container2wasm

**Approach**: CPU emulation with full Linux kernel
**Advantages**:

- Run any existing container without modification
- Support multiple architectures
- Mature container ecosystem compatibility
- Standard container workflows

**Disadvantages**:

- Performance overhead from emulation
- Larger binary sizes
- Additional abstraction layers

### WasmLinux

**Approach**: Native WebAssembly compilation
**Advantages**:

- No CPU emulation overhead
- Smaller binary sizes
- Direct WebAssembly execution
- Better theoretical performance

**Disadvantages**:

- Requires application recompilation
- Limited to compatible applications
- Currently only BusyBox support
- Many missing features

### When to Use Each

**Use container2wasm when**:

- You have existing containers to run
- Application source isn't available
- You need full Linux compatibility
- Development time is limited

**Use WasmLinux when**:

- Building new WASM-native applications
- Performance is critical
- You control the full stack
- Exploring WASM-native OS concepts

## Security Implications

### Sandboxing Layers

container2wasm provides multiple security boundaries:

1. **WASM sandbox**: Limited host access
2. **CPU emulation**: Additional isolation
3. **Container runtime**: Process separation
4. **Linux kernel**: Standard security features

### Trust Boundaries

- Host system remains protected by WASM sandbox
- Containers see only emulated hardware
- No direct system call access to host
- Network isolation by default

## Future Directions

### Planned Improvements

1. **Performance optimizations**:
   - JIT compilation for emulators
   - Improved memory management
   - Faster startup times

2. **Feature additions**:
   - GPU acceleration support
   - Advanced networking features
   - Persistent storage options

3. **Platform expansion**:
   - More architecture support
   - Cloud runtime integration
   - Edge computing scenarios

### Community Development

The project is open source and actively seeking contributions:

- Performance improvements
- Architecture support
- Tool integrations
- Use case documentation

## Practical Use Cases

### 1. CI/CD Pipelines

Run build environments in WebAssembly:

```bash
$ c2w golang:1.20 go-builder.wasm
# Use in CI without installing Go
```

### 2. Security Research

Analyze malware in isolated environments:

```bash
$ c2w malware-analysis:latest sandbox.wasm
# Safe execution without host risk
```

### 3. Application Distribution

Ship applications with dependencies:

```bash
$ c2w myapp:latest portable-app.wasm
# Single file distribution
```

### 4. Cloud Functions

Deploy containers as WebAssembly functions:

```bash
$ c2w microservice:latest function.wasm
# Deploy to WASM-enabled FaaS
```

## Limitations and Considerations

### Current Limitations

1. **Performance overhead**: CPU emulation impacts speed
2. **Image size**: Larger than native WASM applications
3. **Startup time**: Initial boot can be slow
4. **Resource usage**: Higher memory consumption

### Best Practices

1. **Container optimization**:
   - Use minimal base images
   - Remove unnecessary services
   - Optimize for single-process containers

2. **Architecture selection**:
   - Prefer x86_64 or RISC-V
   - Avoid multi-architecture builds

3. **Resource planning**:
   - Allocate sufficient memory
   - Consider startup time in workflows
   - Plan for larger file sizes

## Conclusion

container2wasm represents a pragmatic approach to WebAssembly adoption, prioritizing compatibility over performance. By enabling existing Linux containers to run unmodified on WebAssembly runtimes, it opens new possibilities for application deployment and distribution.

While it may not offer the performance of native WebAssembly applications, container2wasm's ability to leverage the vast ecosystem of existing containers makes it an invaluable tool for organizations looking to explore WebAssembly without massive development investments.

As WebAssembly continues to evolve, projects like container2wasm serve as important bridges, allowing developers to benefit from WASM's portability and security while maintaining their existing workflows and applications. Whether used for development, testing, distribution, or production deployments, container2wasm demonstrates that the future of WebAssembly doesn't require abandoning the past.

## Resources

- [container2wasm GitHub Repository](https://github.com/ktock/container2wasm)
- [container2wasm Releases](https://github.com/ktock/container2wasm/releases)
- [Demo Site](https://ktock.github.io/container2wasm-demo/)
- [NTT Open Source Blog](https://medium.com/nttlabs)
- [WebAssembly System Interface (WASI)](https://wasi.dev/)
- [Bochs x86 Emulator](https://bochs.sourceforge.io/)
- [TinyEMU RISC-V Emulator](https://bellard.org/tinyemu/)
