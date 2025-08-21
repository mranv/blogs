#!/usr/bin/env python3
import os
import re
import glob

def fix_tags_in_file(filepath):
    """Fix all tag formatting issues in a markdown file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix tags: [...] format where [ is on the same line or next line
    # This handles both inline and multiline array formats
    pattern1 = r'(tags:)\s*\n?\s*\[(.*?)\]'
    
    def replace_tags_array(match):
        tags_prefix = match.group(1)
        tags_content = match.group(2)
        
        # Clean up the tags content
        tags_list = []
        # Remove newlines and extra spaces
        tags_content = re.sub(r'\s+', ' ', tags_content)
        
        # Split by comma
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
            # Return empty tags array
            return tags_prefix + '\n  - general'
    
    # Apply the fix for array format
    content = re.sub(pattern1, replace_tags_array, content, flags=re.DOTALL)
    
    # Pattern 2: Fix tags: null or tags without any value
    pattern2 = r'^tags:\s*(?:null)?\s*$'
    content = re.sub(pattern2, 'tags:\n  - general', content, flags=re.MULTILINE)
    
    # Pattern 3: Ensure tags field exists
    if not re.search(r'^tags:', content, re.MULTILINE):
        # Add tags after title if it doesn't exist
        pattern_title = r'(^title:.*$)'
        content = re.sub(pattern_title, r'\1\ntags:\n  - general', content, flags=re.MULTILINE)
    
    # Check if changes were made
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    posts_dir = "/Users/anubhavg/Desktop/blogs/src/content/posts"
    
    # Find all markdown files
    all_files = []
    for root, dirs, files in os.walk(posts_dir):
        for file in files:
            if file.endswith('.md'):
                all_files.append(os.path.join(root, file))
    
    print(f"Scanning {len(all_files)} markdown files for tag issues...\n")
    
    fixed_count = 0
    issues_found = []
    
    for filepath in all_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for various tag issues
        has_issue = False
        
        # Check for array format tags
        if re.search(r'tags:\s*\[', content, re.DOTALL):
            has_issue = True
        # Check for tags followed by category (wrong order)
        elif re.search(r'tags:\s*\ncategory:', content):
            has_issue = True
        # Check for null tags
        elif re.search(r'tags:\s*(?:null)', content):
            has_issue = True
        # Check for missing tags
        elif not re.search(r'^tags:', content, re.MULTILINE):
            has_issue = True
        
        if has_issue:
            issues_found.append(filepath)
            if fix_tags_in_file(filepath):
                rel_path = os.path.relpath(filepath, posts_dir)
                print(f"✅ Fixed: {rel_path}")
                fixed_count += 1
    
    print(f"\n📊 Summary:")
    print(f"  - Total files scanned: {len(all_files)}")
    print(f"  - Issues found: {len(issues_found)}")
    print(f"  - Files fixed: {fixed_count}")
    
    if fixed_count > 0:
        print(f"\n🎉 Successfully fixed tag formatting in {fixed_count} files!")
    else:
        print("\n✨ No tag formatting issues found!")

if __name__ == "__main__":
    main()