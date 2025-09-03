# IAM Roles: Trusted Entity

## Overview

A trusted entity is the AWS entity that is allowed to assume the IAM role. Trusted entities can be AWS services, IAM users, IAM roles, or AWS accounts. The trust relationship is defined in the role's trust policy.

## Common Types of Trusted Entities

1. **AWS Services**: Allows AWS services (like EC2, Lambda) to assume the role.
2. **IAM Users**: Allows specific IAM users to assume the role.
3. **IAM Roles**: Allows other IAM roles to assume the role.
4. **AWS Accounts**: Allows users or roles in other AWS accounts to assume the role.

## Trust Policy

The trust policy is a JSON document that defines the trusted entities and the conditions under which they can assume the role.

### Example Trust Policies

#### AWS Service

Allows the EC2 service to assume the role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```