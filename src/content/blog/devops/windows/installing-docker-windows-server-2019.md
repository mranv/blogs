---
author: Anubhav Gain
pubDatetime: 2023-12-06T13:59:00+05:30
modDatetime: 2023-12-06T13:59:00+05:30
title: Installing Docker on Windows Server 2019
slug: installing-docker-windows-server-2019
featured: true
draft: false
tags:
  - Windows Server 2019
  - Docker
description: Guide to installing Docker on Windows Server 2019, both via OneGet and manual download methods.
---

# Windows Server 2019 - Docker Daemon

<img alt="Shanghai, China" src="/assets/images/photo-f654_gfdgbg4e345g4_sf-bfc8f1f79edc9b8c9913aed41d58a3db.png" width="1500" height="664">

### Installing Docker via OneGet Provider PowerShell Module

Windows containers enable packaging applications with dependencies and leveraging operating system-level virtualization for fast, isolated environments. Here's how to install Docker using the OneGet provider PowerShell module:

1. Install the OneGet PowerShell module:

   ```powershell
   Install-Module -Name DockerMsftProvider -Repository PSGallery -Force
   ```

2. Use OneGet to install the latest version of Docker:

   ```powershell
   Install-Package -Name docker -ProviderName DockerMsftProvider
   ```

3. After installation, reboot the computer:
   ```powershell
   Restart-Computer -Force
   ```

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_01-4ea32b0be138e6853c664ca772e0c220.png" width="1273" height="591">

### Downloading Docker Manually

For environments with restricted internet access, follow these steps to manually download and install Docker Engine - Enterprise:

1. Download the Docker installer archive on a machine with internet access:

   ```powershell
   Invoke-WebRequest -UseBasicParsing -OutFile docker-19.03.3.zip https://download.docker.com/components/engine/windows-server/19.03/docker-19.03.3.zip
   ```

2. Extract the archive, register, and start the Docker service:

   ```powershell
   # Stop Docker service if an earlier version is installed
   Stop-Service docker

   # Extract the archive
   Expand-Archive docker-19.03.3.zip -DestinationPath $Env:ProgramFiles -Force

   # Clean up the zip file
   Remove-Item -Force docker-19.03.3.zip

   # Install Docker. This requires rebooting
   $null = Install-WindowsFeature containers

   Restart-Computer -Force

   # Add Docker to the path for the current session
   $env:path += ';$env:ProgramFiles\docker'

   # Optionally, modify PATH to persist across sessions
   $newPath = '$env:ProgramFiles\docker;' + [Environment]::GetEnvironmentVariable('PATH',[EnvironmentVariableTarget]::Machine)
   [Environment]::SetEnvironmentVariable('PATH', $newPath, [EnvironmentVariableTarget]::Machine)

   # Register the Docker daemon as a service
   dockerd --register-service

   # Start the Docker service
   Start-Service docker
   ```

3. Test your Docker EE installation by running the hello-world container:
   ```powershell
   docker pull hello-world:nanoserver
   docker images
   docker container run hello-world:nanoserver
   ```

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_02-9ef2e9d10b4f275acd828e7634d9cfee.png" width="840" height="469">

This guide covers both automated installation via OneGet and manual installation for environments with restricted internet access.
