# IAM Roles and Trusted Entities Quiz

## Question 1
What is a trusted entity in IAM roles?

- [ ] An IAM policy that grants permissions
- [ ] A specific user or service that is allowed to assume the role
- [ ] A predefined AWS managed role
- [ ] A group of users in IAM

<details>
<summary>Show Answer</summary>
A specific user or service that is allowed to assume the role
</details>

## Question 2
Which of the following is a valid trusted entity type?

- [ ] An AWS Lambda function
- [ ] An IAM group
- [ ] Another IAM role
- [ ] An EC2 instance

<details>
<summary>Show Answer</summary>
Another IAM role
</details>

## Question 3
What is the purpose of the trust policy in an IAM role?

- [ ] To define the permissions the role grants
- [ ] To specify the AWS resources the role can access
- [ ] To define who can assume the role and under what conditions
- [ ] To assign MFA requirements for the role

<details>
<summary>Show Answer</summary>
To define who can assume the role and under what conditions
</details>

## Question 4
Which statement is true about roles and trusted entities?

- [ ] Roles can only be assumed by users within the same AWS account
- [ ] Roles provide temporary security credentials to trusted entities
- [ ] Roles must be attached to a specific EC2 instance
- [ ] Roles cannot be assumed by AWS services

<details>
<summary>Show Answer</summary>
Roles provide temporary security credentials to trusted entities
</details>

## Question 5
How can you allow an EC2 instance to assume an IAM role?

- [ ] By adding the EC2 instance to an IAM group
- [ ] By creating a trust policy that specifies the EC2 service as the trusted entity
- [ ] By directly attaching the role to the EC2 instance
- [ ] By adding the EC2 instance to a VPC

<details>
<summary>Show Answer</summary>
By creating a trust policy that specifies the EC2 service as the trusted entity
</details>
