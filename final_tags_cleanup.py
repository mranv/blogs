#!/usr/bin/env python3
import os
import re
import glob

def clean_tags_completely(filepath):
    """Complete cleanup of tag formatting issues"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # First, find the frontmatter section
    frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not frontmatter_match:
        return False
    
    frontmatter = frontmatter_match.group(1)
    body = content[frontmatter_match.end():]
    
    # Extract existing tags if any (including malformed ones)
    tags = []
    
    # Pattern 1: tags followed by array brackets (even with category in between)
    array_pattern = r'tags:.*?\[(.*?)\]'
    array_match = re.search(array_pattern, frontmatter, re.DOTALL)
    
    if array_match:
        tags_content = array_match.group(1)
        # Clean up the tags content
        tags_content = re.sub(r'\s+', ' ', tags_content)
        for tag in re.split(r',\s*', tags_content):
            tag = tag.strip()
            tag = re.sub(r'^["\'](.*)["\']$', r'\1', tag)
            tag = tag.strip()
            if tag and tag != 'general':
                tags.append(tag)
    
    # Pattern 2: existing YAML list format
    yaml_pattern = r'tags:\s*\n((?:  - .*\n)*)'
    yaml_match = re.search(yaml_pattern, frontmatter)
    
    if yaml_match and not array_match:
        tags_content = yaml_match.group(1)
        for line in tags_content.split('\n'):
            if line.strip().startswith('- '):
                tag = line.strip()[2:].strip()
                if tag and tag != 'general':
                    tags.append(tag)
    
    # Remove all existing tag definitions (including malformed ones)
    # Remove tags: [...] patterns
    frontmatter = re.sub(r'tags:.*?\[.*?\]', '', frontmatter, flags=re.DOTALL)
    # Remove tags: followed by YAML list
    frontmatter = re.sub(r'tags:\s*\n(?:  - .*\n)*', '', frontmatter)
    # Remove standalone tags: line
    frontmatter = re.sub(r'^tags:\s*$', '', frontmatter, flags=re.MULTILINE)
    
    # Clean up any leftover array brackets
    frontmatter = re.sub(r'^\s*\[.*?\]\s*$', '', frontmatter, flags=re.MULTILINE | re.DOTALL)
    
    # Add default tag if no tags found
    if not tags:
        tags = ['general']
    
    # Find where to insert tags (after pubDatetime, before category if exists)
    lines = frontmatter.split('\n')
    new_lines = []
    tags_inserted = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Insert tags after pubDatetime
        if line.startswith('pubDatetime:') and not tags_inserted:
            new_lines.append('tags:')
            for tag in tags:
                new_lines.append(f'  - {tag}')
            tags_inserted = True
    
    # If we couldn't insert tags, add them at the end
    if not tags_inserted:
        new_lines.append('tags:')
        for tag in tags:
            new_lines.append(f'  - {tag}')
    
    # Reconstruct the content
    new_frontmatter = '\n'.join(new_lines)
    new_content = f'---\n{new_frontmatter}\n---{body}'
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    posts_dir = "/Users/anubhavg/Desktop/blogs/src/content/posts"
    
    # Focus on files that might still have issues
    problem_files = [
        "ai-translation/multimodal-ai-translation-2025.md",
        "ai-translation/llm-based-translation-systems-2025.md",
        "ai-translation/quantum-ai-translation-future-2025.md",
        "ai-translation/real-time-ai-translation-technologies-2025.md",
        "ai-integration/ai-powered-blog-platforms-2025.md"
    ]
    
    fixed_count = 0
    
    for rel_path in problem_files:
        filepath = os.path.join(posts_dir, rel_path)
        if os.path.exists(filepath):
            if clean_tags_completely(filepath):
                print(f"✅ Cleaned: {rel_path}")
                fixed_count += 1
        else:
            print(f"⚠️  Not found: {rel_path}")
    
    # Also scan for any other files with array brackets in frontmatter
    print("\nScanning for any remaining issues...")
    
    for root, dirs, files in os.walk(posts_dir):
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if file has problematic patterns in frontmatter
                if re.search(r'^---.*?\[.*?\].*?^---', content, re.MULTILINE | re.DOTALL):
                    rel_path = os.path.relpath(filepath, posts_dir)
                    if rel_path not in problem_files:
                        if clean_tags_completely(filepath):
                            print(f"✅ Fixed additional issue in: {rel_path}")
                            fixed_count += 1
    
    print(f"\n🎉 Total files cleaned: {fixed_count}")

if __name__ == "__main__":
    main()