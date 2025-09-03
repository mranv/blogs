# IAM (Identity and Access Management)

Amazon Identity and Access Management (IAM) enables you to manage access to AWS services and resources securely. Using IAM, you can create and manage AWS users and groups, and use permissions to allow and deny their access to AWS resources.

##
> 🛑 **CAUTION:** Be careful when granting permissions. Overly permissive policies can pose a security risk. Always follow the principle of least privilege.



## Key Concepts



### 1. **Users**
    - Represents a person or a Service that Interact with AWS
    - Each user has a unique set of Security Credentials 


### 2. **Groups**
    - Collections of IAM users.
    - Groups on;y contains users not another Groups
    - Users in groups inherit the permissions assigned to the group.

### 3. **Roles**
    - A set of permissions defining what actions are allowed and denied by an entity in AWS.
    - Roles can be assumed by users, applications, or services.
>   - [Deep Dive on IAM Roles](./roles/README.md)

### 4. **Policies**
    - Documents defining permissions and are associated with users, groups, or roles.
    - Written in JSON and specify what actions are allowed or denied on which resources.

    -Example:
        ```
            {
                "Version" : "2012-10-17",  #Start with this date  
                "id"       : " ",
                "Statement" :  
                [
                        "Sid"      : " ",
                        "Effect"   : " ",
                        "Principal": " ",
                        "Action"   : " ",
                        "Resources": " ",
                        "Condition": " "

                ]

            }
        ```

### 5. **Permissions**
    - It's Basically a Json Document called policies that can be assigned to Users Or groups
        
    - Define what actions a user or service can perform.
    - Managed via policies.

### 6. **Multi-Factor Authentication (MFA)**
   - Provides an extra layer of security by requiring a second form of authentication.
   - Use Google Authenticator or TOTP

### 7. **Access Keys**
   - Used for programmatic access (CDK/SDK) to AWS services.
   - Consist of an Access Key ID and Secret Access Key.

### 8. **IAM Best Practices**
   - Enable MFA for privileged users.
   - Use roles for applications that run on EC2 instances.
   - Rotate credentials regularly.
   - Grant least privilege: only the permissions needed to perform a task.

#### IAM Password Policy

> ⚠️ **CAUTION:** Ensuring a strong password policy is critical for maintaining security.

#### Overview
IAM Password Policies allow you to enforce specific password requirements for your AWS users. This helps ensure that passwords meet your organization's security standards.

#### Key Settings

1. **Minimum Password Length**: Specify the minimum number of characters a password must have.
2. **Require Numbers**: Enforce the inclusion of at least one numeric character.
3. **Require Symbols**: Enforce the inclusion of at least one special character (e.g., `!`, `@`, `#`).
4. **Require Uppercase Letters**: Enforce the inclusion of at least one uppercase letter.
5. **Require Lowercase Letters**: Enforce the inclusion of at least one lowercase letter.
6. **Allow Users to Change Their Own Password**: Permit users to change their passwords.
7. **Password Expiration**: Set a duration after which passwords must be changed.
8. **Prevent Password Reuse**: Restrict the reuse of previous passwords.

### Example Policy JSON

```json
{
    "MinimumPasswordLength": 8,
    "RequireSymbols": true,
    "RequireNumbers": true,
    "RequireUppercaseCharacters": true,
    "RequireLowercaseCharacters": true,
    "AllowUsersToChangePassword": true,
    "ExpirePasswords": true,
    "MaxPasswordAge": 90,
    "PasswordReusePrevention": 5,
    "HardExpiry": false
}
```

