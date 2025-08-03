---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:40:00Z
modDatetime: 2024-04-13T08:40:00Z
title: vsFTP on Ubuntu
slug: vsftp-on-ubuntu
featured: true
draft: false
tags:
  - ubuntu
  - vsftp
  - ftp
description: Guide for setting up vsFTP on Ubuntu.
---

# vsFTP on Ubuntu

<img alt="Guangzhou, China" src="/assets/images/photo-kt443t6d_64hdh43hfh6dgjdfhg4_d-32dbeca90d3e5d2fc5dae0a82fcd32cc.jpg" width="1500" height="615">

### Prerequisites

Ensure SSH is enabled (optional):

```bash
sudo apt update
sudo apt install openssh-server
sudo systemctl status ssh
```

Open necessary ports for vsFTP:

```bash
sudo ufw status
sudo ufw allow ssh
sudo ufw allow 20,21,990/tcp
sudo ufw allow 40000:50000/tcp
sudo ufw status
```

Install vsFTP:

```bash
sudo apt install vsftpd
sudo cp /etc/vsftpd.conf /etc/vsftpd.conf.orig
sudo adduser ftpuser
sudo mkdir -p /home/ftpuser/ftp/files
sudo chown nobody:nogroup /home/ftpuser/ftp
sudo chmod a-w /home/ftpuser/ftp
sudo chown ftpuser:ftpuser /home/ftpuser/ftp/files
sudo ls -la /home/ftpuser/ftp
```

### Configuration

Edit vsFTP configuration:

```bash
sudo nano /etc/vsftpd.conf
```

Paste the following configuration:

```conf
# Example config file /etc/vsftpd.conf
listen=NO
listen_ipv6=YES
anonymous_enable=NO
local_enable=YES
write_enable=YES
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO
user_sub_token=ftpuser
local_root=/home/ftpuser/ftp
pasv_min_port=40000
pasv_max_port=50000
userlist_enable=YES
userlist_file=/etc/vsftpd.userlist
userlist_deny=NO
```

Add ftpuser to userlist:

```bash
echo "ftpuser" | sudo tee -a /etc/vsftpd.userlist
```

Restart vsFTP service:

```bash
sudo systemctl restart vsftpd
```

### Test the Connection

Create a test file:

```bash
echo "vsftpd test file" | sudo tee /home/ftpuser/ftp/files/test.txt
sudo chown ftpuser:ftpuser /home/ftpuser/ftp/files/test.txt
```

Check if you can download it:

```bash
ftp -p ftpuser@192.168.2.111
Connected to 192.168.2.111.
220 (vsFTPd 3.0.5)
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> !ls
```
