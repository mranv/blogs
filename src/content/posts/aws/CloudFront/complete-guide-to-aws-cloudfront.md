---
author: Anubhav Gain
category: aws
description: Complete guide to AWS CloudFront - global content delivery network (CDN) for fast, secure delivery of websites, APIs, and video content worldwide.
draft: false
featured: false
lang: en
pubDatetime: '2024-08-20T11:00:00+05:30'
slug: complete-guide-to-aws-cloudfront-cdn
tags:
- aws
- cloudfront
- cdn
- performance
- caching
- global-delivery
- web-acceleration
title: 'Complete Guide to AWS CloudFront: Global Content Delivery Network'
---

# Complete Guide to AWS CloudFront: Global Content Delivery Network

AWS CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally with low latency and high transfer speeds. CloudFront is integrated with AWS services including S3, EC2, Elastic Load Balancing, and Route 53.

## Overview

CloudFront speeds up the distribution of your static and dynamic web content by delivering it through a worldwide network of data centers called edge locations. When users request content, CloudFront delivers it from the edge location with the lowest latency.

## Key Benefits

### 1. **Global Performance**
- 400+ edge locations worldwide
- Sub-millisecond latency improvements
- Intelligent routing to fastest edge location
- Reduced server load

### 2. **Security**
- DDoS protection with AWS Shield
- SSL/TLS encryption
- AWS WAF integration
- Origin access control
- Signed URLs and cookies

### 3. **Cost Optimization**
- Pay-as-you-use pricing
- Free data transfer between AWS services
- Regional pricing tiers
- Reserved capacity pricing

### 4. **Scalability**
- Automatic scaling
- Handle traffic spikes
- No capacity planning required
- Global infrastructure

## Core Concepts

### 1. **Distributions**
The entity you create in CloudFront to tell the service which files you want to deliver:

```json
{
  "DistributionConfig": {
    "CallerReference": "my-distribution-2024",
    "Comment": "My website CDN",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Items": [
        {
          "Id": "S3-my-bucket",
          "DomainName": "my-bucket.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-my-bucket",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized"
    },
    "Enabled": true
  }
}
```

### 2. **Origins**
The source of your content (S3 bucket, EC2 instance, load balancer, or custom HTTP server):

```yaml
# CloudFormation example
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OriginAccessIdentity}"
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
```

### 3. **Cache Behaviors**
Define how CloudFront handles requests for different URL patterns:

```yaml
CacheBehaviors:
  - PathPattern: "/api/*"
    TargetOriginId: ALBOrigin
    ViewerProtocolPolicy: https-only
    CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
    OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # CORS-S3Origin
  - PathPattern: "/images/*"
    TargetOriginId: S3Origin
    ViewerProtocolPolicy: redirect-to-https
    CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
```

### 4. **Edge Locations**
Physical locations where CloudFront caches your content:
- 400+ edge locations in 90+ cities
- Regional Edge Caches for less popular content
- Automatic failover and load balancing

## Getting Started

### 1. **Simple S3 Website Distribution**
```bash
# Create S3 bucket
aws s3 mb s3://my-website-bucket

# Upload content
aws s3 sync ./website/ s3://my-website-bucket/

# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "my-site-'$(date +%s)'",
  "Comment": "My website CDN",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-my-website-bucket",
        "DomainName": "my-website-bucket.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-my-website-bucket",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "Enabled": true
}'
```

### 2. **Distribution with Custom Domain**
```yaml
# CloudFormation template
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases:
          - www.example.com
          - example.com
        ViewerCertificate:
          AcmCertificateArn: !Ref SSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: example.com
      SubjectAlternativeNames:
        - www.example.com
      ValidationMethod: DNS
```

## Advanced Configuration

### 1. **Multiple Origins Setup**
```yaml
Origins:
  - Id: StaticContent
    DomainName: static.example.com.s3.amazonaws.com
    S3OriginConfig:
      OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OAI}"
  - Id: DynamicContent
    DomainName: api.example.com
    CustomOriginConfig:
      HTTPPort: 80
      HTTPSPort: 443
      OriginProtocolPolicy: https-only
      OriginSSLProtocols:
        - TLSv1.2
      OriginReadTimeout: 30
      OriginKeepaliveTimeout: 5

CacheBehaviors:
  - PathPattern: "/static/*"
    TargetOriginId: StaticContent
    ViewerProtocolPolicy: redirect-to-https
    Compress: true
    CachePolicyId: "managed-caching-optimized"
  - PathPattern: "/api/*"
    TargetOriginId: DynamicContent
    ViewerProtocolPolicy: https-only
    CachePolicyId: "managed-caching-disabled"
    OriginRequestPolicyId: "managed-cors-s3-origin"
```

### 2. **Lambda@Edge Functions**
```python
# Edge function example - Add security headers
import json

def lambda_handler(event, context):
    response = event['Records'][0]['cf']['response']
    headers = response['headers']
    
    # Add security headers
    headers['strict-transport-security'] = [{
        'key': 'Strict-Transport-Security',
        'value': 'max-age=31536000; includeSubDomains'
    }]
    headers['x-content-type-options'] = [{
        'key': 'X-Content-Type-Options',
        'value': 'nosniff'
    }]
    headers['x-frame-options'] = [{
        'key': 'X-Frame-Options',
        'value': 'DENY'
    }]
    
    return response
```

### 3. **CloudFront Functions**
```javascript
// Viewer request function - URL rewriting
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Redirect root to index.html
    if (uri === '/') {
        request.uri = '/index.html';
    }
    // Add .html to clean URLs
    else if (!uri.includes('.')) {
        request.uri = uri + '.html';
    }
    
    return request;
}
```

## Caching Strategies

### 1. **Cache Policies**
```yaml
# Custom cache policy
CachePolicy:
  Type: AWS::CloudFront::CachePolicy
  Properties:
    CachePolicyConfig:
      Name: MyCustomCachePolicy
      Comment: "Custom caching for my application"
      DefaultTTL: 86400  # 1 day
      MaxTTL: 31536000   # 1 year
      MinTTL: 1
      ParametersInCacheKeyAndForwardedToOrigin:
        EnableAcceptEncodingBrotli: true
        EnableAcceptEncodingGzip: true
        QueryStringsConfig:
          QueryStringBehavior: whitelist
          QueryStrings:
            - version
            - locale
        HeadersConfig:
          HeaderBehavior: whitelist
          Headers:
            - CloudFront-Viewer-Country
            - CloudFront-Is-Mobile-Viewer
```

### 2. **Origin Request Policies**
```yaml
OriginRequestPolicy:
  Type: AWS::CloudFront::OriginRequestPolicy
  Properties:
    OriginRequestPolicyConfig:
      Name: MyOriginRequestPolicy
      Comment: "Custom origin request policy"
      QueryStringsConfig:
        QueryStringBehavior: all
      HeadersConfig:
        HeaderBehavior: whitelist
        Headers:
          - Authorization
          - User-Agent
          - Referer
      CookiesConfig:
        CookieBehavior: whitelist
        Cookies:
          - session-id
          - user-preferences
```

### 3. **Cache Invalidation**
```bash
# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/index.html" "/css/*" "/js/app.js"

# Invalidate everything (costly)
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1234567890123 \
  --id I1234567890123
```

## Security Features

### 1. **Origin Access Control (OAC)**
```yaml
# Replace OAI with OAC (recommended)
OriginAccessControl:
  Type: AWS::CloudFront::OriginAccessControl
  Properties:
    OriginAccessControlConfig:
      Name: MyOAC
      OriginAccessControlOriginType: s3
      SigningBehavior: always
      SigningProtocol: sigv4

Distribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - Id: S3Origin
          DomainName: !GetAtt S3Bucket.RegionalDomainName
          OriginAccessControlId: !Ref OriginAccessControl
          S3OriginConfig: {}
```

### 2. **AWS WAF Integration**
```yaml
WebACL:
  Type: AWS::WAFv2::WebACL
  Properties:
    Name: CloudFrontWebACL
    Scope: CLOUDFRONT
    DefaultAction:
      Allow: {}
    Rules:
      - Name: AWSManagedRulesCommonRuleSet
        Priority: 1
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesCommonRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: CommonRuleSetMetric

Distribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      WebACLId: !GetAtt WebACL.Arn
```

### 3. **Signed URLs and Cookies**
```python
# Python example for signed URLs
import boto3
import datetime
from botocore.signers import CloudFrontSigner

def create_signed_url(url, key_id, private_key, expiration_date):
    signer = CloudFrontSigner(key_id, rsa_signer)
    
    signed_url = signer.generate_presigned_url(
        url, 
        date_less_than=expiration_date
    )
    return signed_url

def rsa_signer(message):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives import serialization
    
    with open('private_key.pem', 'rb') as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None
        )
    return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())
```

## Performance Optimization

### 1. **Compression**
```yaml
DefaultCacheBehavior:
  TargetOriginId: MyOrigin
  ViewerProtocolPolicy: redirect-to-https
  Compress: true  # Enable compression
  CachePolicyId: managed-caching-optimized-for-uncompressed-objects
```

### 2. **HTTP/2 and HTTP/3 Support**
```yaml
Distribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      HttpVersion: http2and3  # Enable HTTP/2 and HTTP/3
      IPV6Enabled: true       # Enable IPv6
```

### 3. **Real-Time Logs**
```yaml
RealtimeLogConfig:
  Type: AWS::CloudFront::RealtimeLogConfig
  Properties:
    Name: MyRealtimeLogConfig
    EndPoints:
      - StreamType: Kinesis
        KinesisStreamConfig:
          RoleArn: !GetAtt LogDeliveryRole.Arn
          StreamArn: !GetAtt KinesisStream.Arn
    Fields:
      - timestamp
      - c-ip
      - sc-status
      - cs-method
      - cs-uri-stem
```

## Monitoring and Analytics

### 1. **CloudWatch Metrics**
```python
# Custom metric collection
import boto3

cloudwatch = boto3.client('cloudwatch')

# Put custom metric
cloudwatch.put_metric_data(
    Namespace='CloudFront/Custom',
    MetricData=[
        {
            'MetricName': 'CacheHitRate',
            'Value': 85.5,
            'Unit': 'Percent',
            'Dimensions': [
                {
                    'Name': 'DistributionId',
                    'Value': 'E1234567890123'
                }
            ]
        }
    ]
)
```

### 2. **Access Logs**
```yaml
Distribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Logging:
        Bucket: !GetAtt LoggingBucket.DomainName
        IncludeCookies: false
        Prefix: "cloudfront-logs/"
```

### 3. **CloudWatch Alarms**
```yaml
HighErrorRateAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: CloudFront-High-Error-Rate
    AlarmDescription: CloudFront 4xx/5xx error rate is too high
    MetricName: 4xxErrorRate
    Namespace: AWS/CloudFront
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DistributionId
        Value: !Ref CloudFrontDistribution
```

## Common Use Cases

### 1. **Static Website Hosting**
```yaml
# Complete static website setup
S3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: my-static-website
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true

S3BucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref S3Bucket
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: cloudfront.amazonaws.com
          Action: s3:GetObject
          Resource: !Sub "${S3Bucket}/*"
          Condition:
            StringEquals:
              "AWS:SourceArn": !Sub "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"
```

### 2. **API Acceleration**
```yaml
# API Gateway with CloudFront
ApiGatewayDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - Id: APIGateway
          DomainName: !Sub "${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com"
          CustomOriginConfig:
            HTTPSPort: 443
            OriginProtocolPolicy: https-only
      DefaultCacheBehavior:
        TargetOriginId: APIGateway
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
        AllowedMethods:
          - GET
          - HEAD
          - OPTIONS
          - PUT
          - POST
          - PATCH
          - DELETE
```

### 3. **Video Streaming**
```yaml
# Video content distribution
VideoDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - Id: VideoOrigin
          DomainName: video-content.s3.amazonaws.com
          S3OriginConfig:
            OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OAI}"
      DefaultCacheBehavior:
        TargetOriginId: VideoOrigin
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: managed-caching-optimized
        AllowedMethods:
          - GET
          - HEAD
        SmoothStreaming: false
```

## Best Practices

### 1. **Performance**
- Use appropriate cache policies for different content types
- Enable compression for text-based content
- Use HTTP/2 and HTTP/3
- Implement proper cache headers at origin
- Use CloudFront Functions for simple transformations

### 2. **Security**
- Use HTTPS-only policies
- Implement Origin Access Control (OAC)
- Use AWS WAF for application-level protection
- Implement signed URLs for sensitive content
- Regular security audits

### 3. **Cost Optimization**
- Use appropriate price classes
- Implement smart caching strategies
- Monitor and optimize cache hit ratios
- Use reserved capacity for predictable workloads
- Regular cleanup of old distributions

### 4. **Monitoring**
- Set up CloudWatch alarms for key metrics
- Enable real-time logs for troubleshooting
- Monitor cache performance regularly
- Track error rates and response times

## Troubleshooting

### 1. **Common Issues**
```bash
# Check distribution status
aws cloudfront get-distribution --id E1234567890123

# Test edge location response
curl -I https://d123456789012.cloudfront.net/

# Check cache behavior
curl -H "Cache-Control: no-cache" https://example.com/test.jpg
```

### 2. **Error Handling**
```yaml
# Custom error pages
Distribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      CustomErrorResponses:
        - ErrorCode: 404
          ResponseCode: 404
          ResponsePagePath: /error-pages/404.html
          ErrorCachingMinTTL: 300
        - ErrorCode: 500
          ResponseCode: 500
          ResponsePagePath: /error-pages/500.html
          ErrorCachingMinTTL: 0
```

## Additional Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [Lambda@Edge Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)