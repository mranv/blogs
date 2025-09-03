# IAM Roles

## Overview

An IAM Role in AWS is a set of permissions that define what actions are allowed and denied by an entity in AWS. Unlike users, roles do not have permanent credentials. Instead, they provide temporary security credentials to entities that assume the role.

## Key Concepts

- [Trusted Entities](./Trusted_Entity.md) Learn More about the Trusted entities in AWS IAM Role's

### 1. **Trust Policy**
   - Defines who can assume the role.
   - Specifies the trusted entities (e.g., AWS services, IAM users, or other AWS accounts).

### 2. **Permissions Policy**
   - Defines what actions are allowed or denied for the role.
   - Specifies the AWS resources that the role can access.

### 3. **Assuming a Role**
   - The process by which an entity (e.g., a user or service) temporarily gains the permissions of the role.
   - Temporary security credentials are provided when assuming the role.

## Why Use IAM Roles?

- **Security**: Roles provide temporary security credentials, reducing the risk of long-term credential exposure.
- **Delegation**: Allow users and services to assume roles and perform actions on your behalf.
- **Cross-Account Access**: Grant access to resources in another AWS account without sharing long-term credentials.

## Common Use Cases

### 1. **EC2 Instances**
   - Assign a role to an EC2 instance to grant it permissions to access AWS services and resources.

### 2. **Lambda Functions**
   - Assign a role to a Lambda function to define what AWS services and resources it can interact with.

### 3. **Cross-Account Access**
   - Use roles to grant users in another AWS account access to your resources.

### 4. **Federated Users**
   - Grant external users access to your AWS account using roles and an identity provider (e.g., SAML, OpenID Connect).

## Creating an IAM Role

1. **Sign in to the AWS Management Console.**
2. **Navigate to the IAM Dashboard.**
3. **Choose "Roles" from the left navigation pane.**
4. **Click "Create role".**
5. **Select the type of trusted entity (e.g., AWS service, another AWS account).**
6. **Attach a permissions policy to the role.**
7. **Review and create the role.**

## Example Trust Policy

This example trust policy allows the EC2 service to assume the role:

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

### Quiz 

> 1. [IAM Basic Quiz](./Roles_Trusted_Entity_Q.md) Please take this quiz before taking please go through the link for Trusted Entities 