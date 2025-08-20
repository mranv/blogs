---
author: Anubhav Gain
pubDatetime: 2025-01-28T16:30:00Z
title: "Complete Guide to Git Repository Cleanup and Optimization"
slug: git-repository-cleanup-guide
featured: false
draft: false
tags:
  - git
  - version-control
  - optimization
  - devops
  - best-practices
category: DevOps
description: "A comprehensive guide to cleaning up Git repositories, removing sensitive data, optimizing repository size, and maintaining clean Git history."
---

## Table of Contents

## Introduction

Over time, Git repositories can accumulate unnecessary files, large binaries, sensitive data, and messy commit histories. This guide provides comprehensive techniques for cleaning up repositories, removing sensitive information, and optimizing repository performance.

## BFG Repo-Cleaner Method

BFG Repo-Cleaner is a faster, simpler alternative to git-filter-branch for cleansing bad data from Git repository history.

### Installation

```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Or using Homebrew on macOS
brew install bfg

# Or using package manager on Linux
sudo apt-get install bfg  # Debian/Ubuntu
sudo yum install bfg       # RHEL/CentOS
```

### Removing Files by Name

```bash
# Clone a fresh copy of your repo using --mirror
git clone --mirror git://example.com/my-repo.git

# Remove all files named 'id_rsa' or 'id_dsa'
java -jar bfg.jar --delete-files id_{dsa,rsa} my-repo.git

# Remove all files with .log extension
java -jar bfg.jar --delete-files '*.log' my-repo.git

# Clean up the reflog and garbage collect
cd my-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Push the cleaned repository
git push
```

### Removing Large Files

```bash
# Remove all blobs bigger than 100M
java -jar bfg.jar --strip-blobs-bigger-than 100M my-repo.git

# Remove the 20 largest files
java -jar bfg.jar --strip-biggest-blobs 20 my-repo.git

# Clean up
cd my-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

### Removing Sensitive Data

```bash
# Create a file with sensitive strings to remove
echo 'PASSWORD=secretpass123' >> passwords.txt
echo 'API_KEY=abcd1234efgh5678' >> passwords.txt
echo 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' >> passwords.txt

# Replace sensitive strings with ***REMOVED***
java -jar bfg.jar --replace-text passwords.txt my-repo.git

# Clean up
cd my-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

## git filter-branch Method

While slower than BFG, git filter-branch is built into Git and offers more flexibility.

### Removing a File from All History

```bash
# Remove a file from all commits
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/sensitive-file' \
  --prune-empty --tag-name-filter cat -- --all

# Remove the original refs backed up by filter-branch
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin

# Expire all reflog entries
git reflog expire --expire=now --all

# Garbage collect
git gc --prune=now --aggressive

# Force push to remote
git push origin --force --all
git push origin --force --tags
```

### Removing a Directory

```bash
# Remove an entire directory from history
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch path/to/directory' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Changing Author Information

```bash
#!/bin/sh
# Script to change author information

git filter-branch --env-filter '
OLD_EMAIL="wrong@example.com"
CORRECT_NAME="Correct Name"
CORRECT_EMAIL="correct@example.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

## git filter-repo Method (Recommended)

git filter-repo is the officially recommended tool by the Git project for repository filtering.

### Installation

```bash
# Using pip
pip install git-filter-repo

# Or download directly
wget https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
chmod +x git-filter-repo
sudo mv git-filter-repo /usr/local/bin/
```

### Basic Usage

```bash
# Remove a file
git filter-repo --path sensitive-file.txt --invert-paths

# Remove a directory
git filter-repo --path secret-directory/ --invert-paths

# Remove multiple paths
git filter-repo --path file1.txt --path dir1/ --path dir2/ --invert-paths

# Keep only specific paths
git filter-repo --path src/ --path docs/
```

### Advanced Filtering

```bash
# Remove files by pattern
git filter-repo --filename-callback '
  if filename.endswith(b".log"):
    return None
  return filename
'

# Remove large files
git filter-repo --strip-blobs-bigger-than 10M

# Replace text in all files
echo 'PASSWORD==>***REMOVED***' > expressions.txt
echo 'regex:password\s*=\s*["'\'']*[^"'\'']+["'\'']*==>password = "***REMOVED***"' >> expressions.txt
git filter-repo --replace-text expressions.txt
```

## Finding Large Files in Git History

### Script to Find Large Objects

```bash
#!/bin/bash
# find-large-files.sh - Find the largest objects in Git history

# Set the number of largest files to show
NUM_FILES=20

# Find large objects
git rev-list --objects --all |
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
  sed -n 's/^blob //p' |
  sort --numeric-sort --key=2 |
  tail -n $NUM_FILES |
  cut -c 1-12,41- |
  $(command -v gnumfmt || echo numfmt) --field=2 --to=iec-i --suffix=B --padding=7 --round=nearest
```

### Using git-sizer

```bash
# Install git-sizer
wget https://github.com/github/git-sizer/releases/download/v1.5.0/git-sizer-1.5.0-linux-amd64.zip
unzip git-sizer-1.5.0-linux-amd64.zip
sudo mv git-sizer /usr/local/bin/

# Analyze repository
git-sizer --verbose

# Output in JSON format
git-sizer --json > git-sizer-report.json
```

## Cleaning Git History

### Squashing Commits

```bash
# Interactive rebase to squash last N commits
git rebase -i HEAD~N

# In the editor, change 'pick' to 'squash' or 's' for commits to squash
# Example:
# pick abc1234 First commit
# squash def5678 Second commit
# squash ghi9012 Third commit

# For squashing all commits into one
git rebase -i --root
```

### Cleaning Up Merge Commits

```bash
# Rebase to remove merge commits
git rebase -i --rebase-merges HEAD~20

# Or to completely linearize history
git rebase -i HEAD~20
```

### Removing Empty Commits

```bash
# Remove commits that don't change anything
git filter-branch --prune-empty --tag-name-filter cat -- --all

# Using git filter-repo (better)
git filter-repo --prune-empty always
```

## Repository Maintenance

### Garbage Collection

```bash
# Run garbage collection
git gc

# Aggressive garbage collection (takes longer but more thorough)
git gc --aggressive --prune=now

# Verify repository integrity
git fsck --full

# Clean unnecessary files and optimize repository
git clean -fd
git remote prune origin
git repack -a -d --depth=250 --window=250
```

### Pruning Objects

```bash
# Prune all unreachable objects
git prune --expire=now

# Prune reflog entries older than 30 days
git reflog expire --expire=30.days --all

# Prune remote-tracking branches
git remote prune origin

# Remove stale branches
git for-each-ref --format '%(refname:short)' refs/heads | grep -v master | xargs git branch -D
```

### Repository Statistics

```bash
#!/bin/bash
# repo-stats.sh - Display repository statistics

echo "Repository Size:"
du -sh .git

echo -e "\nObject Count:"
git count-objects -v

echo -e "\nLargest Files in Working Directory:"
find . -type f -not -path './.git/*' -exec du -h {} + | sort -rh | head -20

echo -e "\nBranch Count:"
git branch -a | wc -l

echo -e "\nCommit Count:"
git rev-list --all --count

echo -e "\nContributors:"
git shortlog -sn
```

## Removing Sensitive Data Patterns

### Common Patterns to Remove

```bash
# Create patterns file
cat > sensitive-patterns.txt << 'EOF'
# AWS Credentials
regex:AKIA[0-9A-Z]{16}==>[AWS_ACCESS_KEY_REMOVED]
regex:aws_secret_access_key\s*=\s*["']?[A-Za-z0-9/+=]{40}["']?==>aws_secret_access_key="[REMOVED]"

# API Keys
regex:api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9]{32,}["']?==>api_key="[REMOVED]"
regex:token\s*[:=]\s*["']?[A-Za-z0-9]{32,}["']?==>token="[REMOVED]"

# Passwords
regex:password\s*[:=]\s*["']?[^"'\s]+["']?==>password="[REMOVED]"
regex:passwd\s*[:=]\s*["']?[^"'\s]+["']?==>passwd="[REMOVED]"

# Private Keys
regex:-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----==>-----BEGIN PRIVATE KEY-----[REMOVED]-----END PRIVATE KEY-----

# Database URLs
regex:postgres://[^@]+@[^/]+/\w+==>postgres://[REMOVED]@[REMOVED]/[REMOVED]
regex:mysql://[^@]+@[^/]+/\w+==>mysql://[REMOVED]@[REMOVED]/[REMOVED]
regex:mongodb://[^@]+@[^/]+/\w+==>mongodb://[REMOVED]@[REMOVED]/[REMOVED]
EOF

# Apply patterns with git filter-repo
git filter-repo --replace-text sensitive-patterns.txt
```

### Verification Script

```bash
#!/bin/bash
# verify-sensitive-data.sh - Check for sensitive data in repository

echo "Checking for potential sensitive data..."

# Check for private keys
echo -e "\nSearching for private keys:"
git grep -E "BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY" || echo "No private keys found"

# Check for AWS credentials
echo -e "\nSearching for AWS credentials:"
git grep -E "AKIA[0-9A-Z]{16}" || echo "No AWS access keys found"

# Check for passwords
echo -e "\nSearching for passwords:"
git grep -iE "password\s*[:=]" | grep -v -E "(example|test|dummy|placeholder)" || echo "No passwords found"

# Check for API keys
echo -e "\nSearching for API keys:"
git grep -iE "(api[_-]?key|token)\s*[:=]" | grep -v -E "(example|test|dummy|placeholder)" || echo "No API keys found"

# Check for large files
echo -e "\nLarge files in current working tree:"
find . -type f -size +10M -not -path './.git/*' -exec ls -lh {} \;
```

## Best Practices

### Pre-Cleanup Checklist

```bash
#!/bin/bash
# pre-cleanup-checklist.sh

echo "Git Repository Cleanup Pre-Check"
echo "================================"

# Check if repository is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Working directory is not clean. Commit or stash changes first."
    exit 1
else
    echo "✅ Working directory is clean"
fi

# Check for backup
echo -e "\n⚠️  Have you backed up your repository? (y/n)"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Please backup your repository first!"
    echo "Run: git clone --mirror $(git remote get-url origin) backup-$(date +%Y%m%d)"
    exit 1
fi

# List remotes
echo -e "\n📡 Remote repositories:"
git remote -v

# Show repository size
echo -e "\n📊 Repository size:"
du -sh .git

# Count objects
echo -e "\n🔢 Object count:"
git count-objects -v

echo -e "\n✅ Pre-cleanup check complete. Safe to proceed."
```

### .gitignore Templates

```bash
# Common patterns to add to .gitignore before cleanup

# Sensitive files
*.pem
*.key
*.pfx
*.p12
.env
.env.*
config/secrets.yml
config/database.yml

# Large files
*.log
*.sql
*.dump
*.tar
*.tar.gz
*.zip
*.7z
*.rar

# OS generated files
.DS_Store
Thumbs.db
*.swp
*~

# IDE files
.idea/
.vscode/
*.iml
.project
.settings/

# Build artifacts
build/
dist/
*.egg-info/
__pycache__/
node_modules/
target/
*.class
*.jar
```

### Post-Cleanup Steps

```bash
#!/bin/bash
# post-cleanup.sh - Steps to perform after cleanup

echo "Post-Cleanup Tasks"
echo "=================="

# Update all branches
echo "\n1. Updating all branches..."
for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///')
do
    echo "Updating branch: $branch"
    git checkout $branch
    git pull origin $branch
done

# Notify team members
echo -e "\n2. Team notification template:"
cat << EOF
Subject: Important: Git Repository Cleanup Completed

Team,

We have completed a cleanup of our Git repository. This cleanup included:
- Removing large files from history
- Removing sensitive data
- Optimizing repository size

ACTION REQUIRED:
1. Delete your local repository
2. Re-clone the repository: git clone [repository-url]
3. If you have local branches, you'll need to recreate them
4. Update any CI/CD pipelines that might be affected

The repository size has been reduced from X GB to Y GB.

Please complete these steps before continuing work.

Thank you for your cooperation.
EOF

# Verify cleanup
echo -e "\n3. Verification:"
echo "New repository size: $(du -sh .git | cut -f1)"
echo "Object count: $(git count-objects -v | grep 'count:' | cut -d' ' -f2)"

# Update documentation
echo -e "\n4. Update documentation:"
echo "- Update README with new clone instructions"
echo "- Document any changed procedures"
echo "- Update CI/CD configurations if needed"
```

## Security Considerations

### Rotating Compromised Credentials

After removing sensitive data from Git history:

1. **Immediately rotate all exposed credentials**
2. **Audit access logs** for any unauthorized usage
3. **Update all systems** using the compromised credentials
4. **Implement secret scanning** in CI/CD pipeline

### Preventing Future Issues

```bash
# Install pre-commit hooks
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
EOF

# Install hooks
pre-commit install

# Create baseline for existing secrets (to ignore)
detect-secrets scan > .secrets.baseline
```

## Conclusion

Regular repository maintenance is crucial for keeping Git repositories fast, secure, and manageable. Key takeaways:

1. **Always backup** before performing destructive operations
2. **Use BFG or git-filter-repo** instead of filter-branch when possible
3. **Rotate credentials** immediately after removing them from history
4. **Implement preventive measures** like pre-commit hooks
5. **Communicate with your team** before and after cleanup
6. **Document the process** for future reference

Remember that rewriting history affects all collaborators, so coordinate carefully and ensure everyone is prepared for the changes.
