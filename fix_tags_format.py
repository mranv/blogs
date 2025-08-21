#!/usr/bin/env python3
import os
import re
import sys

def fix_tags_format(filepath):
    """Fix incorrect tags formatting in a markdown file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match tags: [ ... ] format (incorrect)
    pattern = r'(tags:\s*)\[(.*?)\]'
    
    def replace_tags(match):
        tags_prefix = match.group(1)
        tags_content = match.group(2)
        
        # Clean up the tags content
        # Remove quotes, spaces, and split by comma
        tags_list = []
        for tag in re.split(r',\s*', tags_content):
            tag = tag.strip()
            # Remove quotes
            tag = re.sub(r'^["\'](.*)["\']$', r'\1', tag)
            tag = tag.strip()
            if tag:
                tags_list.append(tag)
        
        # Format as YAML list
        if tags_list:
            yaml_tags = tags_prefix + '\n'
            for tag in tags_list:
                yaml_tags += f'  - {tag}\n'
            return yaml_tags.rstrip()
        else:
            return tags_prefix
    
    # Replace incorrect format
    new_content = re.sub(pattern, replace_tags, content, flags=re.DOTALL)
    
    # Check if changes were made
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    # List of files to fix
    files_to_fix = [
        "/Users/anubhavg/Desktop/blogs/src/content/posts/microservices/database-patterns-microservices-guide.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/microservices/cqrs-event-sourcing-patterns-guide.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/2025/wazuh-nats-active-response-orchestration.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/2025/wazuh-nats-integration-xdr-platform.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/2025/wazuh-nats-realtime-fim-streaming.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/2025/wazuh-nats-distributed-correlation-engine.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/2025/windows-api-security-virtualalloc-createthread.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/wazuh-security/wazuh-blog-17-ot-ics-security.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/wazuh-security/wazuh-blog-05-zero-day-defense.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/wazuh-security/wazuh-blog-07-ai-ml-integration.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/wazuh-security/wazuh-blog-08-custom-decoders.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/security/opensearch-security-analytics-dashboard-installation.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/coreos-kubernetes-deployment-guide.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav-journey.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/ebpf-security-tools-practical-guide.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/xdr-platform-revolution.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/guide/index.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/markdown.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/expressive-code.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/draft.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/video.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/anubhav/markdown-extended.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/invinsense-xdr-platform.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/rust-security-series/blog-10-supply-chain-security-trusted-publishing-rust.md",
        "/Users/anubhavg/Desktop/blogs/src/content/posts/rust-security-series/ebpf-fundamentals-rust-security.md"
    ]
    
    fixed_count = 0
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            if fix_tags_format(filepath):
                rel_path = os.path.basename(filepath)
                print(f"✅ Fixed tags format in: {rel_path}")
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
    
    print(f"\n🎉 Successfully fixed tags format in {fixed_count} files!")

if __name__ == "__main__":
    main()