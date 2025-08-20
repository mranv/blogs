#!/usr/bin/env python3
import os
import re
import glob
from datetime import datetime, timedelta
import random

# DevOps topics mapping for better categorization
DEVOPS_TOPICS = {
    "1-10": {"category": "DevOps Fundamentals", "tags": ["devops", "fundamentals", "introduction", "basics"]},
    "11-20": {"category": "Version Control & CI/CD", "tags": ["git", "cicd", "jenkins", "github-actions", "automation"]},
    "21-30": {"category": "Infrastructure as Code", "tags": ["terraform", "ansible", "iac", "automation", "infrastructure"]},
    "31-40": {"category": "Containerization & Orchestration", "tags": ["docker", "kubernetes", "containers", "orchestration", "microservices"]},
    "41-50": {"category": "Cloud Platforms", "tags": ["aws", "azure", "gcp", "cloud", "cloud-native"]},
    "51-60": {"category": "Monitoring & Observability", "tags": ["monitoring", "prometheus", "grafana", "elk-stack", "observability"]},
    "61-70": {"category": "Security & Compliance", "tags": ["devsecops", "security", "compliance", "vulnerability-scanning", "secure-coding"]},
    "71-80": {"category": "Serverless & Advanced Topics", "tags": ["serverless", "lambda", "functions", "edge-computing", "advanced-devops"]},
    "81-90": {"category": "Best Practices & Culture", "tags": ["best-practices", "devops-culture", "collaboration", "agile", "continuous-improvement"]},
    "91-96": {"category": "Community & Learning", "tags": ["community", "learning", "career", "devops-journey", "resources"]}
}

# Better titles for each day
DAY_TITLES = {
    1: "Introduction to 90 Days of DevOps Journey",
    2: "Understanding DevOps Culture and Principles",
    3: "DevOps Lifecycle and Continuous Everything",
    4: "Agile Development and DevOps Integration",
    5: "Building Cross-Functional Empathy in DevOps",
    6: "DevOps Stories and Real-World Experiences",
    7: "The State of DevOps and Industry Trends",
    8: "DevOps Knowledge Gap and Learning Path",
    9: "Creating Your DevOps Learning Environment",
    10: "Linux Fundamentals for DevOps Engineers",
    11: "Network Knowledge and DevOps Practices",
    12: "SSH Keys and Secure Access Management",
    13: "Web Servers and Application Deployment",
    14: "Database Management in DevOps",
    15: "Git Version Control Fundamentals",
    16: "Advanced Git Workflows and Branching",
    17: "GitHub Collaboration and Pull Requests",
    18: "CI/CD Pipeline Introduction",
    19: "Jenkins Setup and Configuration",
    20: "Building Your First CI/CD Pipeline",
    21: "Infrastructure as Code Concepts",
    22: "Terraform Basics and Provider Setup",
    23: "Terraform Resources and State Management",
    24: "Terraform Modules and Best Practices",
    25: "Ansible Introduction and Playbooks",
    26: "Ansible Roles and Galaxy",
    27: "Ansible Vault and Security",
    28: "Configuration Management at Scale",
    29: "IaC Testing and Validation",
    30: "GitOps and Declarative Infrastructure",
    31: "Docker Fundamentals and Containers",
    32: "Docker Images and Dockerfile Best Practices",
    33: "Docker Compose for Multi-Container Apps",
    34: "Docker Networking and Storage",
    35: "Kubernetes Architecture and Components",
    36: "Kubernetes Deployments and Services",
    37: "Kubernetes ConfigMaps and Secrets",
    38: "Kubernetes Ingress and Load Balancing",
    39: "Kubernetes StatefulSets and Persistent Storage",
    40: "Kubernetes Security and RBAC",
    41: "Cloud Computing Fundamentals",
    42: "AWS Core Services Overview",
    43: "AWS EC2 and Compute Services",
    44: "AWS Storage Solutions - S3 and EBS",
    45: "AWS Networking - VPC and Security Groups",
    46: "Azure Fundamentals and Services",
    47: "Azure DevOps and Pipelines",
    48: "Google Cloud Platform Essentials",
    49: "Multi-Cloud Strategy and Management",
    50: "Cloud Cost Optimization",
    51: "Monitoring Strategy and Metrics",
    52: "Prometheus Setup and Configuration",
    53: "Grafana Dashboards and Visualization",
    54: "ELK Stack for Log Management",
    55: "Application Performance Monitoring",
    56: "Distributed Tracing with OpenTelemetry",
    57: "Alerting and Incident Management",
    58: "SRE Principles and Error Budgets",
    59: "Chaos Engineering and Resilience",
    60: "Observability Best Practices",
    61: "DevSecOps Introduction and Principles",
    62: "Security Scanning in CI/CD Pipelines",
    63: "Container Security and Image Scanning",
    64: "Secrets Management and Vault",
    65: "SAST and DAST Implementation",
    66: "Compliance as Code",
    67: "Security Policies and Governance",
    68: "Threat Modeling for DevOps",
    69: "Zero Trust Architecture",
    70: "Security Incident Response",
    71: "Serverless Computing Introduction",
    72: "AWS Lambda and Function Development",
    73: "Azure Functions and Logic Apps",
    74: "Serverless Frameworks and Tools",
    75: "Event-Driven Architecture",
    76: "API Gateway and Microservices",
    77: "Service Mesh with Istio",
    78: "GraphQL and Modern APIs",
    79: "Edge Computing and CDN",
    80: "WebAssembly and Future Tech",
    81: "DevOps Best Practices Compilation",
    82: "Team Collaboration and Communication",
    83: "Documentation and Knowledge Sharing",
    84: "Continuous Learning Culture",
    85: "DevOps Metrics and KPIs",
    86: "Scaling DevOps in Enterprise",
    87: "DevOps Transformation Challenges",
    88: "Building DevOps Teams",
    89: "DevOps Tools Ecosystem",
    90: "DevOps Career Path and Growth",
    91: "Community Contributions and Open Source",
    92: "DevOps Certifications and Training",
    93: "DevOps Resources and References",
    94: "DevOps Future Trends",
    95: "DevOps Success Stories",
    96: "90 Days Recap and Next Steps"
}

def get_day_number(filename):
    """Extract day number from filename"""
    match = re.search(r'day(\d+)\.md', filename)
    if match:
        return int(match.group(1))
    return None

def get_category_and_tags(day_num):
    """Get category and tags based on day number"""
    if 1 <= day_num <= 10:
        return DEVOPS_TOPICS["1-10"]
    elif 11 <= day_num <= 20:
        return DEVOPS_TOPICS["11-20"]
    elif 21 <= day_num <= 30:
        return DEVOPS_TOPICS["21-30"]
    elif 31 <= day_num <= 40:
        return DEVOPS_TOPICS["31-40"]
    elif 41 <= day_num <= 50:
        return DEVOPS_TOPICS["41-50"]
    elif 51 <= day_num <= 60:
        return DEVOPS_TOPICS["51-60"]
    elif 61 <= day_num <= 70:
        return DEVOPS_TOPICS["61-70"]
    elif 71 <= day_num <= 80:
        return DEVOPS_TOPICS["71-80"]
    elif 81 <= day_num <= 90:
        return DEVOPS_TOPICS["81-90"]
    else:
        return DEVOPS_TOPICS["91-96"]

def create_description(day_num, title):
    """Create a meaningful description"""
    category_info = get_category_and_tags(day_num)
    return f"Day {day_num} of 90 Days of DevOps - {title}. Part of the {category_info['category']} series covering essential DevOps concepts and hands-on practices."

def update_day_post(filepath, day_num):
    """Update a day post with better metadata and dates"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get title and category info
    title = DAY_TITLES.get(day_num, f"Day {day_num} - DevOps Journey")
    category_info = get_category_and_tags(day_num)
    description = create_description(day_num, title)
    
    # Calculate date for this day (sequential from Jan 1, 2024)
    base_date = datetime(2024, 1, 1, 9, 0, 0)  # Start at Jan 1, 2024 at 9 AM
    pub_date = base_date + timedelta(days=day_num - 1)
    
    # Add some variation to time
    hour_options = [8, 9, 10, 14, 15, 16, 19, 20]
    minute_options = [0, 15, 30, 45]
    pub_date = pub_date.replace(hour=random.choice(hour_options), minute=random.choice(minute_options))
    
    # Mod date is 7-30 days later
    mod_date = pub_date + timedelta(days=random.randint(7, 30))
    
    # Format dates
    pub_date_str = pub_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")
    mod_date_str = mod_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")
    
    # Update frontmatter
    content = re.sub(
        r'^title:\s*.*$',
        f'title: "{title}"',
        content,
        flags=re.MULTILINE
    )
    
    # Update slug
    slug = title.lower().replace(" ", "-").replace("'", "")
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = f"90days-{day_num:02d}-{slug[:50]}"  # Limit length
    content = re.sub(
        r'^slug:\s*.*$',
        f'slug: {slug}',
        content,
        flags=re.MULTILINE
    )
    
    # Update description
    content = re.sub(
        r'^description:.*$',
        f'description: "{description}"',
        content,
        flags=re.MULTILINE
    )
    
    # Update tags
    tags_str = "\n".join([f"  - {tag}" for tag in category_info['tags']])
    content = re.sub(
        r'^tags:\s*\n(?:  - .*\n)*',
        f'tags:\n{tags_str}\n',
        content,
        flags=re.MULTILINE
    )
    
    # Add category
    if 'category:' not in content:
        # Insert category after tags
        content = re.sub(
            r'(tags:\s*\n(?:  - .*\n)*)',
            f'\\1category: {category_info["category"]}\n',
            content,
            flags=re.MULTILINE
        )
    else:
        content = re.sub(
            r'^category:.*$',
            f'category: {category_info["category"]}',
            content,
            flags=re.MULTILINE
        )
    
    # Set featured for important days
    featured_days = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90]
    if day_num in featured_days:
        content = re.sub(
            r'^featured:\s*false.*$',
            'featured: true',
            content,
            flags=re.MULTILINE
        )
    
    # Update dates
    content = re.sub(
        r'^pubDatetime:\s*.*$',
        f'pubDatetime: {pub_date_str}',
        content,
        flags=re.MULTILINE
    )
    
    content = re.sub(
        r'^modDatetime:\s*.*$',
        f'modDatetime: {mod_date_str}',
        content,
        flags=re.MULTILINE
    )
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return title, pub_date

def main():
    posts_dir = "/Users/anubhavg/Desktop/blogs/src/content/posts/2024"
    
    # Process day posts
    day_files = glob.glob(os.path.join(posts_dir, "day*.md"))
    day_files.sort()
    
    print(f"Found {len(day_files)} day posts to enhance")
    print(f"Setting dates starting from January 1, 2024\n")
    
    for filepath in day_files:
        filename = os.path.basename(filepath)
        day_num = get_day_number(filename)
        
        if day_num:
            title, pub_date = update_day_post(filepath, day_num)
            print(f"✅ Day {day_num:02d} ({pub_date.strftime('%Y-%m-%d')}): {title}")
    
    # Handle the blacklist file separately
    blacklist_file = os.path.join(posts_dir, "2024-blacklist.md")
    if os.path.exists(blacklist_file):
        with open(blacklist_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update this special file
        content = re.sub(r'^title:.*$', 'title: "2024 Security Blacklist and Threat Intelligence"', content, flags=re.MULTILINE)
        content = re.sub(r'^description:.*$', 'description: "Comprehensive security blacklist and threat intelligence for 2024, covering malicious IPs, domains, and security indicators."', content, flags=re.MULTILINE)
        content = re.sub(r'^tags:\s*\n(?:  - .*\n)*', 'tags:\n  - security\n  - threat-intelligence\n  - blacklist\n  - cybersecurity\n  - malware\n', content, flags=re.MULTILINE)
        content = re.sub(r'^category:.*$', 'category: Security', content, flags=re.MULTILINE)
        if 'category:' not in content:
            content = re.sub(r'(tags:\s*\n(?:  - .*\n)*)', '\\1category: Security\n', content, flags=re.MULTILINE)
        
        # Set date for blacklist (April 10, 2024)
        pub_date = datetime(2024, 4, 10, 10, 0, 0)
        mod_date = pub_date + timedelta(days=15)
        content = re.sub(r'^pubDatetime:.*$', f'pubDatetime: {pub_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")}', content, flags=re.MULTILINE)
        content = re.sub(r'^modDatetime:.*$', f'modDatetime: {mod_date.strftime("%Y-%m-%dT%H:%M:%S+05:30")}', content, flags=re.MULTILINE)
        
        with open(blacklist_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Enhanced 2024-blacklist.md (2024-04-10)")
    
    print(f"\n🎉 Successfully enhanced all posts in the 2024 directory!")
    print(f"📅 All 90 Days of DevOps posts now start from January 1, 2024")

if __name__ == "__main__":
    main()