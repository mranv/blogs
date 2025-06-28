---
author: Anubhav Gain
pubDatetime: 2025-06-28T11:30:00+05:30
modDatetime: 2025-06-28T11:30:00+05:30
title: Monitoring Windows Remotely via WMI with Icinga
slug: icinga-windows-monitoring-wmi
featured: false
draft: false
tags:
  - icinga
  - windows
  - monitoring
  - wmi
  - nagios
  - infrastructure
  - devops
description: Comprehensive guide to monitor Windows machines without agents using WMI (Windows Management Instrumentation) with Icinga and check_wmi_plus plugin.
---

# Monitoring Windows Remotely via WMI with Icinga

This guide details how to monitor Windows machines without installing an agent by leveraging the Windows Management Instrumentation (WMI) layer. It focuses on using the check_wmi_plus plugin with Icinga, along with the WMIC client on Linux. Although other methods (e.g. PowerShell, SSH, SNMP) exist, this guide covers the WMI solution primarily for legacy environments (Windows Server 2012 and later).

## Tested With:

- Icinga 2 v2.10.x
- Icinga Web 2 v2.6.x
- Windows Server 2012 and later

## Table of Contents

## Prerequisites & Requirements

Before beginning the installation, ensure you have the following:

**On Linux:**

- A working WMIC client.
- Perl installed along with required modules (see Icinga/Nagios Plugin section for details).

**On Windows:**

- WMI enabled (usually on by default).
- A dedicated Windows user with minimal privileges but granted WMI access.
- (Recommended) WinRM and Remote Desktop enabled on the Windows node.

## Linux Setup: Installing WMIC

The WMIC tool (WMI client for Linux) is needed to query Windows systems. You can either compile it from source or use pre-packaged binaries.

### Compiling from Source

1. **Download the Source Code:**

   Visit: http://edcint.co.nz/checkwmiplus/download/zenoss-wmi-source-v1-3-14/

   Save the archive in a directory such as `/usr/local/src/`.

2. **Extract and Build:**

   ```bash
   cd /usr/local/src/
   tar -xzf zenoss-wmi-source-v1-3-14.tar.gz
   cd Samba/source
   ./autogen.sh
   ./configure
   make
   # Optionally run "make install" if needed
   ```

3. **Troubleshooting Compilation Issues:**

   If you encounter an error like:

   ```
   Can't use 'defined(@array)' (Maybe you should just omit the defined()?) at ./pidl/pidl line 583.
   ```

   Edit the indicated line to comment out the use of defined(), then re-run make.

   You might also see a message such as:

   ```
   make: *** No rule to make target `wmi/wmiq.o', needed by `bin/wmiq'.  Stop.
   ```

   This can be safely ignored.

   If further errors occur, try adjusting compiler directives, for example:

   ```bash
   make "CPP=gcc -E -ffreestanding"
   ```

4. **Test the Installation:**

   Run a basic WMIC query:

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

If compiling is problematic, you may consider using available RPMs or DEBs. Examples include:

- **RPM:** `wmi-1.3.14-4.el7.art.x86_64.rpm`
- **DEB:**
  - Debian: [Inverse.ca Debian packages](https://inverse.ca/debian)
  - Ubuntu: [Inverse.ca Ubuntu packages](https://inverse.ca/ubuntu)

## Icinga/Nagios Plugin

The plugin `check_wmi_plus` is written in Perl. It requires several Perl modules which can be installed either via your distribution's package manager or CPAN.

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

   Obtain the latest release from the plugin [Releases page](https://github.com/speartail/checkwmiplus/releases) and unpack it in a directory accessible by Icinga (ideally under your custom plugin directory).

3. **Adjust the Plugin Configuration:**

   Edit the main Perl script `check_wmi_plus.pl` and update:

   - **Location of utils.pm:** Adjust the path if it is not in `/usr/lib/nagios/plugins`.
   - **Base Directory:** Set the `$base_dir` variable to the installation directory of `check_wmi_plus.pl`.
   - **WMIC Binary Path:** Update `$wmic_command` with the full path to your WMIC executable.
   - **Optional Settings:** Configure `$wmi_ini_dir` (path for INI files) and `$tmp_dir` (for temporary files, default `/tmp/`).

## Windows Configuration

To allow remote monitoring, configure WMI on the Windows server:

1. **Create a Dedicated User:**

   - Open the WMI Control console:
     Press Start → Run, type `wmimgmt.msc`, and click OK.

   - In the console tree, right-click WMI Control and select Properties.

   - Navigate to the Security tab.

   - Select the desired namespace and click Security.

   - Click Add, enter the username (or group), verify with Check Names, and click OK.

   - In the Permissions list, adjust the following (as needed):
     - Execute Methods: Enable
     - Remote Enable: Enable
     - Enable Account: Enable
     - Read Security: Enable
     - Disable write permissions (Full Write, Partial Write, Provider Write, Edit Security).

2. **Enable WinRM and Remote Desktop in the Firewall:**

   Open a command prompt (with administrative privileges) and run:

   ```cmd
   netsh advfirewall firewall set rule group="remote desktop" new enable=Yes
   winrm quickconfig
   ```

   When prompted, confirm the changes. You should see output confirming that WinRM is set up with a listener on HTTP.

3. **Further Reading:**
   Refer to [WMI for Windows Server documentation](https://docs.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page) for additional details.

## Icinga Configuration

Once the Linux and Windows sides are ready, you need to configure Icinga to use the WMI plugin.

### Authentication File

Create an authentication file (e.g., `/etc/icinga2/wmi.auth`) with the following content:

```
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

Add the following command definition (e.g., in your `commands.conf` file):

```icinga2
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

Create a service template specifically for WMI-based checks (for example, in `templates.conf`):

```icinga2
template Service "wmi-service" {
    import "generic-service"
    check_command = "check_wmi"
    check_interval = 1m
    retry_interval = 1m
}
```

Then define service apply rules in a file (e.g., `wmi-services.conf`). Below are some sample rules:

#### Free Disk Space

```icinga2
apply Service "Free Disk Space" {
    import "generic-service"
    vars.check_mode = "checkvolsize"
    vars.wmi_arg1 = "."
    vars.wmi_arg2 = "1"
    vars.wmi_arg3 = "1"
    vars.wmi_warn = "88"
    vars.wmi_crit = "92"
    check_command = "check_wmi"
    assign where host.vars.os == "Windows"
    ignore where host.vars.disable_wmi
}
```

#### CPU Utilization

```icinga2
apply Service "CPU Utilization" {
    import "generic-service"
    vars.check_mode = "checkeachcpu"
    vars.wmi_warn = "95"
    vars.wmi_crit = "99"
    vars.wmi_timeout = "160"
    check_command = "check_wmi"
    assign where host.vars.os == "Windows" && host.vars.cpu_utilz
    ignore where host.vars.disable_wmi
}
```

#### IIS: Connections

```icinga2
apply Service "IIS: Connections" {
    import "generic-service"
    vars.check_mode = "checkiis"
    vars.wmi_submode = "connections"
    vars.wmi_arg1 = "_Total"
    vars.wmi_timeout = "190"
    check_command = "check_wmi"
    assign where host.vars.iis_server
    ignore where host.vars.disable_wmi
}
```

#### MSSQL: General Statistics

```icinga2
apply Service "MSSQL: General Statistics" {
    import "generic-service"
    vars.check_mode = "checksql"
    vars.wmi_submode = "general"
    if (host.vars.mssql_edition == "Express") {
        vars.wmi_arg1 = "MSSQLSQLEXPRESS_MSSQLSQLEXPRESS"
    }
    check_command = "check_wmi"
    assign where host.vars.mssql_server
    ignore where host.vars.disable_wmi
}
```

#### Event Log: Application

```icinga2
apply Service "Event Log: Application" {
    import "generic-service"
    vars.check_mode = "checkeventlog"
    vars.wmi_arg1 = "application"
    vars.wmi_arg2 = "2"
    vars.wmi_arg3 = "1"
    vars.wmi_warn = "50"
    vars.wmi_crit = "100"
    check_command = "check_wmi"
    assign where host.vars.os == "Windows" && host.vars.event_log_application
    ignore where host.vars.disable_wmi
}
```

Additional services or specific process checks (e.g., monitoring a Jenkins process) can be added following the above examples.

## Conclusion & FAQ

### Conclusion

While using WMI via the check_wmi_plus plugin may not be the most future-proof solution (especially with enhanced PowerShell and SSH support in newer Windows versions), it remains a robust method for monitoring legacy environments. This guide should help you set up both the Linux side (WMIC and plugin) and the necessary Windows configurations, as well as integrate the checks into your Icinga setup.

### FAQ

**Q: What types of services can I monitor using WMI?**
A: You can monitor uptime, disk usage, CPU load, Active Directory, RDP sessions, IIS, MSSQL, Event Logs, and process statuses.

**Q: Can I create my own custom scripts?**
A: Yes, you can. However, many find that PowerShell (or SSH for Windows Server 2019 and later) offers a more versatile, future-proof approach.

**Q: Need help with configuration files?**
A: The [Icinga community forum](https://community.icinga.com) is an excellent resource for support and discussion.

This document provides a comprehensive overview of setting up and using remote Windows monitoring through WMI with Icinga. Adapt the instructions as necessary for your infrastructure and security policies.
