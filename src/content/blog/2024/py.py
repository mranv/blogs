import os
import datetime

def add_metadata_to_file(file_path):
    # Get the file name without extension
    file_name = os.path.splitext(os.path.basename(file_path))[0]
    
    # Generate metadata
    current_time = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S+05:30")
    metadata = f"""---
author: Anubhav Gain
pubDatetime: {current_time}
modDatetime: {current_time}
title: {file_name.replace('-', ' ').title()}
slug: {file_name.lower()}
featured: false
draft: true
tags:
- tag1
- tag2
description: Add your description here.
---

"""
    
    # Read the existing content
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if the file already has metadata
    if content.startswith('---'):
        print(f"Skipping {file_path}: Metadata already exists")
        return
    
    # Combine new metadata with existing content
    new_content = metadata + content
    
    # Write the new content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(new_content)
    
    print(f"Added metadata to {file_path}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                add_metadata_to_file(file_path)

# Get the current directory
current_directory = os.getcwd()

# Process the current directory and its subdirectories
process_directory(current_directory)

print("Metadata addition complete.")
