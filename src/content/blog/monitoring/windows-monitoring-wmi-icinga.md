---
author: Anubhav Gain
pubDatetime: 2024-04-25T14:00:00Z
modDatetime: 2024-04-25T14:00:00Z
title: Monitoring Windows Systems Remotely Through WMI with Icinga
slug: windows-monitoring-wmi-icinga
featured: true
draft: false
tags:
  - monitoring
  - windows
  - wmi
  - icinga
  - check_wmi_plus
  - devops
description: A comprehensive guide to setting up remote Windows monitoring using WMI and the check_wmi_plus plugin with Icinga, without requiring an agent on the Windows servers.
---

# Monitoring Windows Systems Remotely Through WMI with Icinga

This guide details how to monitor Windows machines without installing an agent by leveraging the Windows Management Instrumentation (WMI) layer. It focuses on using the check_wmi_plus plugin with Icinga, along with the WMIC client on Linux. Although other methods (e.g., PowerShell, SSH, SNMP) exist, this guide covers the WMI solution primarily for legacy environments (Windows Server 2012 and later).

**Tested With:**

- Icinga 2 v2.10.x
- Icinga Web 2 v2.6.x
- Windows Server 2012 and later

## Table of Contents

1. [Prerequisites & Requirements](#prerequisites--requirements)
2. [Linux Setup: Installing WMIC](#linux-setup-installing-wmic)
3. [Icinga/Nagios Plugin: Installing check_wmi_plus](#icinganagios-plugin-installing-check_wmi_plus)
4. [Windows Configuration](#windows-configuration)
5. [Icinga Configuration](#icinga-configuration)
6. [Conclusion & FAQ](#conclusion--faq)

## Prerequisites & Requirements

Before beginning the installation, ensure you have the following:

**On Linux:**

- A working WMIC client
- Perl installed along with required modules (see Icinga/Nagios Plugin section for details)

**On Windows:**

- WMI enabled (usually on by default)
- A dedicated Windows user with minimal privileges but granted WMI access
- (Recommended) WinRM and Remote Desktop enabled on the Windows node

## Linux Setup: Installing WMIC

The WMIC tool (WMI client for Linux) is needed to query Windows systems. You can either compile it from source or use pre-packaged binaries.

### Compiling from Source

1. **Download the Source Code:**

   ```bash
   cd /usr/local/src/
   wget http://edcint.co.nz/checkwmiplus/download/zenoss-wmi-source-v1-3-14/
   ```

2. **Extract and Build:**

   ```bash
   tar -xzf zenoss-wmi-source-v1-3-14.tar.gz
   cd Samba/source
   ./autogen.sh
   ./configure
   make
   # Optionally run "make install" if needed
   ```

3. **Troubleshooting Compilation Issues:**

   - If you encounter an error like:

     ```
     Can't use 'defined(@array)' (Maybe you should just omit the defined()?) at ./pidl/pidl line 583.
     ```

     Edit the indicated line to comment out the use of defined(), then re-run make.

   - You might also see a message such as:

     ```
     make: *** No rule to make target `wmi/wmiq.o', needed by `bin/wmiq'.  Stop.
     ```

     This can be safely ignored.

   - If further errors occur, try adjusting compiler directives, for example:
     ```bash
     make "CPP=gcc -E -ffreestanding"
     ```

4. **Test the Installation:**

   ```bash
   wmic -U [domain/]adminuser%password //host_or_IP "select TotalPhysicalMemory from Win32_ComputerSystem"
   ```

   Expected output:

   ```
   CLASS: Win32_ComputerSystem
   Name|TotalPhysicalMemory
   hostname|412180664
   ```

### Pre-packaged Binaries

If compiling is problematic, you may consider using available RPMs or DEBs:

- **RPM:** wmi-1.3.14-4.el7.art.x86_64.rpm
- **DEB:**
  - Debian: Inverse.ca Debian packages
  - Ubuntu: Inverse.ca Ubuntu packages

## Icinga/Nagios Plugin: Installing check_wmi_plus

The plugin check_wmi_plus is written in Perl. It requires several Perl modules which can be installed either via your distribution's package manager or CPAN.

Here is an example of the modules and the desired versions:

| Module Name      | Installed Version | Desired Version |
| ---------------- | ----------------- | --------------- |
| Config::IniFiles | 2.79              | 2.58            |
| Getopt::Long     | 2.4               | 2.38            |
| DateTime         | 1.04              | 0.66            |
| Number::Format   | 1.73              | 1.73            |
| Data::Dumper     | 2.145             | 2.125           |
| Scalar::Util     | 1.27              | 1.22            |
| Storable         | 2.45              | 2.22            |
| Perl Version     | 5.016003          | 5.01            |

### Installation Steps

1. **Install Required Perl Modules:**

   For example, to install a module from CPAN:

   ```bash
   cpan install Number::Format
   ```

   If you require a specific version, provide the full module distribution filename:

   ```bash
   cpan SHLOMIF/Config-IniFiles-2.58.tar.gz
   ```

2. **Download and Unpack check_wmi_plus:**

   Obtain the latest release from the plugin Releases page and unpack it in a directory accessible by Icinga (ideally under your custom plugin directory).

3. **Adjust the Plugin Configuration:**

   Edit the main Perl script check_wmi_plus.pl and update:

   - Location of utils.pm: Adjust the path if it is not in /usr/lib/nagios/plugins.
   - Base Directory: Set the $base_dir variable to the installation directory of check_wmi_plus.pl.
   - WMIC Binary Path: Update $wmic_command with the full path to your WMIC executable.
   - Optional Settings: Configure $wmi_ini_dir (path for INI files) and $tmp_dir (for temporary files, default /tmp/).

## Windows Configuration

To allow remote monitoring, configure WMI on the Windows server:

### Create a Dedicated User

1. Open the WMI Control console:

   - Press Start → Run, type `wmimgmt.msc`, and click OK.

2. In the console tree, right-click WMI Control and select Properties.

3. Navigate to the Security tab.

4. Select the desired namespace and click Security.

5. Click Add, enter the username (or group), verify with Check Names, and click OK.

6. In the Permissions list, adjust the following (as needed):
   - Execute Methods: Enable
   - Remote Enable: Enable
   - Enable Account: Enable
   - Read Security: Enable
   - Disable write permissions (Full Write, Partial Write, Provider Write, Edit Security).

### Enable WinRM and Remote Desktop in the Firewall

Open a command prompt (with administrative privileges) and run:

```cmd
netsh advfirewall firewall set rule group="remote desktop" new enable=Yes
winrm quickconfig
```

When prompted, confirm the changes. You should see output confirming that WinRM is set up with a listener on HTTP.

**Further Reading:**
Refer to WMI for Windows Server documentation for additional details.

## Icinga Configuration

Once the Linux and Windows sides are ready, you need to configure Icinga to use the WMI plugin.

### Authentication File

Create an authentication file (e.g., `/etc/icinga2/wmi.auth`) with the following content:

```ini
username=myusername
password=mypassword
domain=mydomain
```

Set proper permissions to secure the file:

```bash
chown root:root /etc/icinga2/wmi.auth
chmod 0400 /etc/icinga2/wmi.auth
```

### Defining the CheckCommand

Add the following command definition (e.g., in your commands.conf file):

```
object CheckCommand "check_wmi" {
    import "plugin-check-command"
    command = [ PluginDir + "/check_wmi_plus.pl" ]
    arguments = {
        "-H" = {
            value = "$host.address$"
            description = "Name or IP address of host to monitor"
        }
        "-A" = {
            value = "$wmi_authfile_path$"
            description = "Authentication file path"
        }
        "-m" = {
            value = "$check_mode$"
            description = "WMI mode to use for specific check"
        }
        "-s" = {
            value = "$wmi_submode$"
            description = "Optional WMI submode"
        }
        "-a" = {
            value = "$wmi_arg1$"
            description = "First argument to WMI"
        }
        "-o" = {
            value = "$wmi_arg2$"
            description = "Second argument to WMI"
        }
        "-3" = {
            value = "$wmi_arg3$"
            description = "Third argument to WMI"
        }
        "-4" = {
            value = "$wmi_arg4$"
            description = "Fourth argument to WMI"
        }
        "-y" = {
            value = "$wmi_delay$"
            description = "Delay between consecutive WMI queries"
        }
        "-w" = {
            value = "$wmi_warn$"
            description = "Warning threshold"
        }
        "-c" = {
            value = "$wmi_crit$"
            description = "Critical threshold"
        }
        "--nodatamode" = {
            set_if = "$wmi_nodatamode$"
        }
        "--inidir" = {
            value = "$wmi_inidir$"
            description = "Path to the INI directory"
        }
    }

    vars.wmi_authfile_path = "/etc/icinga2/wmi.auth"
    vars.wmi_inidir = "/opt/icinga/plugins/check_wmi_plus.d"
    vars.wmi_nodatamode = false
}
```

### Service Templates and Apply Rules

Create a service template specifically for WMI-based checks (for example, in templates.conf):
