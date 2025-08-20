#!/usr/bin/env python3
import os
import re
import glob
from datetime import datetime, timedelta
import random

def extract_date(content):
    """Extract pubDatetime from content"""
    match = re.search(r'^pubDatetime:\s*(.+)$', content, re.MULTILINE)
    if match:
        date_str = match.group(1).strip()
        try:
            # Handle various date formats
            if 'T' in date_str:
                # ISO format
                if '+' in date_str or 'Z' in date_str:
                    # Has timezone
                    date_part = date_str.split('+')[0].split('Z')[0]
                else:
                    date_part = date_str
                return datetime.fromisoformat(date_part)
            else:
                # Try other formats
                return datetime.strptime(date_str, "%Y-%m-%d")
        except:
            return None
    return None

def main():
    posts_dir = "/Users/anubhavg/Desktop/blogs/src/content/posts"
    today = datetime(2025, 8, 21, 12, 0, 0)  # Today's date: Aug 21, 2025
    
    # Find all markdown files
    all_files = []
    for root, dirs, files in os.walk(posts_dir):
        for file in files:
            if file.endswith('.md'):
                all_files.append(os.path.join(root, file))
    
    print(f"Found {len(all_files)} total markdown files")
    
    # Categorize posts by date
    future_posts = []
    past_posts = []
    
    for filepath in all_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        pub_date = extract_date(content)
        if pub_date:
            if pub_date > today:
                future_posts.append((filepath, pub_date, content))
            else:
                past_posts.append((filepath, pub_date))
    
    print(f"Found {len(future_posts)} posts with future dates")
    print(f"Found {len(past_posts)} posts with past dates")
    
    if not future_posts:
        print("No future posts to fix!")
        return
    
    # Sort future posts by their original date to maintain relative order
    future_posts.sort(key=lambda x: x[1])
    
    # Find the latest past date
    if past_posts:
        latest_past = max(past_posts, key=lambda x: x[1])[1]
    else:
        latest_past = datetime(2023, 1, 1)
    
    print(f"Latest past date: {latest_past}")
    print(f"Today's date: {today}")
    
    # Calculate date range for redistribution
    # Start from 2 days after latest past date to avoid conflicts
    start_date = latest_past + timedelta(days=2)
    
    # If start date is already past today, we need to redistribute existing posts too
    if start_date > today:
        start_date = datetime(2023, 6, 1)  # Start from June 2023
    
    # Calculate days available
    days_available = (today - start_date).days
    
    if days_available < len(future_posts):
        # Need to fit more posts than days available
        # Will assign multiple posts per day
        print(f"Warning: {len(future_posts)} posts to fit in {days_available} days")
    
    # Generate dates for future posts
    if days_available >= len(future_posts):
        # Spread evenly across available days
        interval = days_available // len(future_posts)
        new_dates = []
        current_date = start_date
        
        for i in range(len(future_posts)):
            # Add some randomness within the interval
            days_to_add = interval * i + random.randint(0, min(interval-1, 7))
            post_date = start_date + timedelta(days=days_to_add)
            
            # Make sure we don't exceed today
            if post_date > today:
                post_date = today - timedelta(days=random.randint(1, 30))
            
            # Randomize time
            hour = random.choice([8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
            minute = random.choice([0, 15, 30, 45])
            post_date = post_date.replace(hour=hour, minute=minute, second=0)
            
            new_dates.append(post_date)
    else:
        # More posts than days - distribute multiple per day
        posts_per_day = len(future_posts) / days_available
        new_dates = []
        
        for i, (filepath, old_date, content) in enumerate(future_posts):
            day_offset = int(i / posts_per_day)
            post_date = start_date + timedelta(days=day_offset)
            
            # Make sure we don't exceed today
            if post_date > today:
                post_date = today - timedelta(days=random.randint(1, 10))
            
            # Vary the time for posts on the same day
            hour = 8 + (i % 12)  # Spread across the day
            minute = random.choice([0, 15, 30, 45])
            post_date = post_date.replace(hour=hour, minute=minute, second=0)
            
            new_dates.append(post_date)
    
    # Sort to ensure chronological order
    date_post_pairs = list(zip(new_dates, future_posts))
    date_post_pairs.sort(key=lambda x: x[0])
    
    # Update the posts
    updated_count = 0
    for new_date, (filepath, old_date, content) in date_post_pairs:
        # Format the new date
        new_date_str = new_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        
        # Update pubDatetime
        content = re.sub(
            r'^pubDatetime:\s*.*$',
            f'pubDatetime: {new_date_str}',
            content,
            flags=re.MULTILINE
        )
        
        # Also update modDatetime to be a few days after pubDatetime
        mod_date = new_date + timedelta(days=random.randint(1, 15))
        mod_date_str = mod_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        
        if 'modDatetime:' in content:
            content = re.sub(
                r'^modDatetime:\s*.*$',
                f'modDatetime: {mod_date_str}',
                content,
                flags=re.MULTILINE
            )
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        updated_count += 1
        
        # Show progress for first few and last few
        if updated_count <= 5 or updated_count > len(future_posts) - 3:
            rel_path = os.path.relpath(filepath, posts_dir)
            print(f"✅ Updated {rel_path}: {old_date.date()} → {new_date.date()}")
        elif updated_count == 6:
            print(f"... updating {len(future_posts) - 10} more posts ...")
    
    print(f"\n🎉 Successfully updated {updated_count} posts with future dates!")
    print(f"All posts now have dates between {start_date.date()} and {today.date()}")

if __name__ == "__main__":
    main()