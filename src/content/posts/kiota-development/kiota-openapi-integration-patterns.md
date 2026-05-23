---
slug: 'kiota-openapi-integration-patterns'

title: "OpenAPI Integration Patterns with Microsoft Kiota: Enterprise-Grade API Client Generation"
description: "Master OpenAPI specification integration with Microsoft Kiota. Learn advanced patterns, custom generators, and enterprise deployment strategies."
pubDatetime: 2025-08-05T14:00:00+05:30
tags: ["microsoft-kiota", "openapi", "api-design", "code-generation", "enterprise-architecture", "sdk-development"]
categories: ["api-development", "openapi", "code-generation"]
draft: false

---

## Introduction

OpenAPI specifications serve as the foundation for modern API development, and Microsoft Kiota transforms these specifications into production-ready, strongly-typed client libraries. This comprehensive guide explores advanced OpenAPI integration patterns, custom generation strategies, and enterprise deployment approaches using Kiota.

## OpenAPI Specification Optimization for Kiota

### Schema Design Best Practices

```yaml
# optimized-api.yml
openapi: 3.0.3
info:
  title: Enterprise Product API
  version: 2.0.0
  description: Comprehensive product management API optimized for Kiota generation
  contact:
    name: API Team
    email: api-team@company.com
  license:
    name: MIT

servers:
  - url: https://api.company.com/v2
    description: Production server
  - url: https://staging-api.company.com/v2
    description: Staging server

# Global security schemes
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.company.com/oauth2/authorize
          tokenUrl: https://auth.company.com/oauth2/token
          scopes:
            read: Read access
            write: Write access
            admin: Administrative access

  schemas:
    # Base entity with common properties
    BaseEntity:
      type: object
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
          example: "123e4567-e89b-12d3-a456-426614174000"
        createdAt:
          type: string
          format: date-time
          readOnly: true
        updatedAt:
          type: string
          format: date-time
          readOnly: true
        version:
          type: integer
          minimum: 0
          description: Optimistic locking version
      required:
        - id
        - createdAt
        - updatedAt
        - version

    # Product entity inheriting from BaseEntity
    Product:
      allOf:
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            name:
              type: string
              minLength: 1
              maxLength: 200
              example: "Premium Laptop"
            description:
              type: string
              maxLength: 2000
              example: "High-performance laptop for professionals"
            price:
              type: number
              format: decimal
              minimum: 0
              example: 1299.99
            currency:
              type: string
              pattern: '^[A-Z]{3}$'
              example: "USD"
            category:
              $ref: '#/components/schemas/Category'
            tags:
              type: array
              items:
                type: string
              maxItems: 10
            metadata:
              type: object
              additionalProperties:
                type: string
          required:
            - name
            - price
            - currency
            - category

    Category:
      allOf:
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            name:
              type: string
              minLength: 1
              maxLength: 100
            parentId:
              type: string
              format: uuid
              nullable: true
          required:
            - name

    # Pagination wrapper
    PagedResult:
      type: object
      properties:
        data:
          type: array
          items: {}
        pagination:
          $ref: '#/components/schemas/PaginationInfo'
      required:
        - data
        - pagination

    PaginationInfo:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        pageSize:
          type: integer
          minimum: 1
          maximum: 100
        totalPages:
          type: integer
          minimum: 0
        totalItems:
          type: integer
          minimum: 0
        hasNext:
          type: boolean
        hasPrevious:
          type: boolean
      required:
        - page
        - pageSize
        - totalPages
        - totalItems
        - hasNext
        - hasPrevious

    # Error responses
    ApiError:
      type: object
      properties:
        error:
          type: string
          example: "VALIDATION_FAILED"
        message:
          type: string
          example: "Request validation failed"
        details:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'
        timestamp:
          type: string
          format: date-time
        traceId:
          type: string
          example: "trace-123"
      required:
        - error
        - message
        - timestamp

    ValidationError:
      type: object
      properties:
        field:
          type: string
          example: "name"
        code:
          type: string
          example: "REQUIRED"
        message:
          type: string
          example: "Field is required"
      required:
        - field
        - code
        - message

  # Reusable parameters
  parameters:
    PageParameter:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    PageSizeParameter:
      name: pageSize
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    ProductIdParameter:
      name: productId
      in: path
      required: true
      schema:
        type: string
        format: uuid

  # Reusable responses
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'

# API Paths optimized for Kiota generation
paths:
  /products:
    get:
      summary: List products with pagination
      operationId: listProducts
      tags: [Products]
      security:
        - BearerAuth: []
        - ApiKeyAuth: []
      parameters:
        - $ref: '#/components/parameters/PageParameter'
        - $ref: '#/components/parameters/PageSizeParameter'
        - name: categoryId
          in: query
          schema:
            type: string
            format: uuid
        - name: search
          in: query
          schema:
            type: string
            maxLength: 200
        - name: sortBy
          in: query
          schema:
            type: string
            enum: [name, price, createdAt]
            default: createdAt
        - name: sortOrder
          in: query
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Products retrieved successfully
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/PagedResult'
                  - properties:
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/Product'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      summary: Create new product
      operationId: createProduct
      tags: [Products]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 200
                description:
                  type: string
                  maxLength: 2000
                price:
                  type: number
                  format: decimal
                  minimum: 0
                currency:
                  type: string
                  pattern: '^[A-Z]{3}$'
                categoryId:
                  type: string
                  format: uuid
                tags:
                  type: array
                  items:
                    type: string
                  maxItems: 10
              required:
                - name
                - price
                - currency
                - categoryId
      responses:
        '201':
          description: Product created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /products/{productId}:
    parameters:
      - $ref: '#/components/parameters/ProductIdParameter'
    
    get:
      summary: Get product by ID
      operationId: getProduct
      tags: [Products]
      security:
        - BearerAuth: []
        - ApiKeyAuth: []
      responses:
        '200':
          description: Product retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '404':
          $ref: '#/components/responses/NotFound'
        '401':
          $ref: '#/components/responses/Unauthorized'

    put:
      summary: Update product
      operationId: updateProduct
      tags: [Products]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 200
                description:
                  type: string
                  maxLength: 2000
                price:
                  type: number
                  format: decimal
                  minimum: 0
                currency:
                  type: string
                  pattern: '^[A-Z]{3}$'
                categoryId:
                  type: string
                  format: uuid
                tags:
                  type: array
                  items:
                    type: string
                  maxItems: 10
                version:
                  type: integer
                  minimum: 0
              required:
                - version
      responses:
        '200':
          description: Product updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '400':
          $ref: '#/components/responses/ValidationError'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          description: Version conflict
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'
        '401':
          $ref: '#/components/responses/Unauthorized'

    delete:
      summary: Delete product
      operationId: deleteProduct
      tags: [Products]
      security:
        - BearerAuth: []
      responses:
        '204':
          description: Product deleted successfully
        '404':
          $ref: '#/components/responses/NotFound'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /categories:
    get:
      summary: List categories
      operationId: listCategories
      tags: [Categories]
      security:
        - BearerAuth: []
        - ApiKeyAuth: []
      responses:
        '200':
          description: Categories retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Category'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /health:
    get:
      summary: Health check endpoint
      operationId: healthCheck
      tags: [System]
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                    example: "2.0.0"
```

## Advanced Kiota Generation Patterns

### Multi-Target Client Generation

```bash
#!/bin/bash
# generate-multi-target.sh

set -e

API_SPEC="./specs/enterprise-api.yml"
BASE_OUTPUT="./generated"

# Configuration for different client targets
declare -A TARGETS=(
    ["backend-csharp"]="csharp|Company.Api.Client|BackendApiClient"
    ["frontend-typescript"]="typescript|frontend-client|FrontendApiClient"
    ["mobile-java"]="java|com.company.mobile.api|MobileApiClient"
    ["cli-go"]="go|github.com/company/cli-client|CliApiClient"
    ["scripts-python"]="python|company_api_client|ScriptApiClient"
)

echo "🚀 Starting multi-target API client generation..."

for target in "${!TARGETS[@]}"; do
    IFS='|' read -r language namespace client_name <<< "${TARGETS[$target]}"
    output_dir="${BASE_OUTPUT}/${target}"
    
    echo "📦 Generating ${language} client: ${client_name}"
    
    # Clean previous generation
    rm -rf "${output_dir}"
    mkdir -p "${output_dir}"
    
    # Generate client with target-specific configuration
    case $language in
        "csharp")
            kiota generate \
                --openapi "${API_SPEC}" \
                --language csharp \
                --class-name "${client_name}" \
                --namespace-name "${namespace}" \
                --output "${output_dir}" \
                --backing-store \
                --additional-data \
                --serializer Microsoft.Kiota.Serialization.Json.JsonSerializationWriterFactory \
                --deserializer Microsoft.Kiota.Serialization.Json.JsonParseNodeFactory \
                --structured-mime-types application/json
            ;;
        "typescript")
            kiota generate \
                --openapi "${API_SPEC}" \
                --language typescript \
                --class-name "${client_name}" \
                --output "${output_dir}" \
                --structured-mime-types application/json
            ;;
        "java")
            kiota generate \
                --openapi "${API_SPEC}" \
                --language java \
                --class-name "${client_name}" \
                --package-name "${namespace}" \
                --output "${output_dir}" \
                --backing-store \
                --structured-mime-types application/json
            ;;
        "go")
            kiota generate \
                --openapi "${API_SPEC}" \
                --language go \
                --class-name "${client_name}" \
                --package-name "${namespace}" \
                --output "${output_dir}" \
                --structured-mime-types application/json
            ;;
        "python")
            kiota generate \
                --openapi "${API_SPEC}" \
                --language python \
                --class-name "${client_name}" \
                --package-name "${namespace}" \
                --output "${output_dir}" \
                --structured-mime-types application/json
            ;;
    esac
    
    echo "✅ Generated ${language} client successfully"
done

echo "🎉 Multi-target generation completed!"
```

### Custom Configuration Templates

```yaml
# kiota-configs/backend-config.yml
openapi: ./specs/enterprise-api.yml
language: csharp
output: ./src/Generated/Backend
className: EnterpriseApiClient
namespaceName: Company.Enterprise.ApiClient
clientClassName: EnterpriseApiClient
backingStore: true
additionalData: true
structuredMimeTypes:
  - application/json
  - application/xml
includePaths:
  - "/products/**"
  - "/categories/**"
  - "/health"
excludePaths:
  - "/admin/**"
  - "/internal/**"
serializers:
  - Microsoft.Kiota.Serialization.Json.JsonSerializationWriterFactory
  - Microsoft.Kiota.Serialization.Text.TextSerializationWriterFactory
deserializers:
  - Microsoft.Kiota.Serialization.Json.JsonParseNodeFactory
  - Microsoft.Kiota.Serialization.Text.TextParseNodeFactory
```

```yaml
# kiota-configs/frontend-config.yml
openapi: ./specs/enterprise-api.yml
language: typescript
output: ./src/generated/frontend
className: FrontendApiClient
clientClassName: FrontendApiClient
structuredMimeTypes:
  - application/json
includePaths:
  - "/products/**"
  - "/categories/**"
excludePaths:
  - "/admin/**"
  - "/internal/**"
  - "/system/**"
```

## Enterprise Integration Architecture

### Service Layer Implementation

```csharp
// Services/IProductService.cs
using Company.Enterprise.ApiClient;
using Company.Enterprise.ApiClient.Models;

public interface IProductService
{
    Task<PagedResult<Product>> GetProductsAsync(
        int page = 1, 
        int pageSize = 20, 
        string? categoryId = null, 
        string? search = null,
        CancellationToken cancellationToken = default);
    
    Task<Product?> GetProductByIdAsync(
        string productId, 
        CancellationToken cancellationToken = default);
    
    Task<Product> CreateProductAsync(
        CreateProductRequest request, 
        CancellationToken cancellationToken = default);
    
    Task<Product> UpdateProductAsync(
        string productId, 
        UpdateProductRequest request, 
        CancellationToken cancellationToken = default);
    
    Task DeleteProductAsync(
        string productId, 
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<Category>> GetCategoriesAsync(
        CancellationToken cancellationToken = default);
}

// Services/ProductService.cs
using Company.Enterprise.ApiClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;

public class ProductService : IProductService
{
    private readonly EnterpriseApiClient _apiClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ProductService> _logger;
    private readonly IAsyncPolicy _retryPolicy;
    private readonly IAsyncPolicy _circuitBreakerPolicy;
    
    public ProductService(
        EnterpriseApiClient apiClient,
        IMemoryCache cache,
        ILogger<ProductService> logger)
    {
        _apiClient = apiClient;
        _cache = cache;
        _logger = logger;
        
        _retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<ApiException>(ex => IsTransientError(ex.ResponseStatusCode))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        "Retry {RetryCount} after {Delay}s for {Operation}",
                        retryCount, timespan.TotalSeconds, context.OperationKey);
                });
        
        _circuitBreakerPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<ApiException>(ex => ex.ResponseStatusCode >= 500)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromMinutes(1),
                onBreak: (exception, duration) =>
                {
                    _logger.LogWarning(
                        "Circuit breaker opened for {Duration}s due to {Exception}",
                        duration.TotalSeconds, exception.Message);
                },
                onReset: () =>
                {
                    _logger.LogInformation("Circuit breaker reset");
                });
    }
    
    public async Task<PagedResult<Product>> GetProductsAsync(
        int page = 1, 
        int pageSize = 20, 
        string? categoryId = null, 
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"products_{page}_{pageSize}_{categoryId}_{search}";
        
        return await GetWithCacheAsync(cacheKey, async () =>
        {
            var requestConfig = new RequestConfiguration<ProductsRequestBuilder.ProductsRequestBuilderGetQueryParameters>
            {
                QueryParameters = new ProductsRequestBuilder.ProductsRequestBuilderGetQueryParameters
                {
                    Page = page,
                    PageSize = pageSize,
                    CategoryId = categoryId,
                    Search = search
                }
            };
            
            return await ExecuteWithPoliciesAsync(async () =>
            {
                var result = await _apiClient.Products.GetAsync(requestConfig, cancellationToken);
                _logger.LogInformation(
                    "Retrieved {Count} products (page {Page}/{TotalPages})",
                    result.Data?.Count ?? 0, result.Pagination?.Page, result.Pagination?.TotalPages);
                
                return result;
            });
        }, TimeSpan.FromMinutes(5));
    }
    
    public async Task<Product?> GetProductByIdAsync(
        string productId, 
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"product_{productId}";
        
        return await GetWithCacheAsync(cacheKey, async () =>
        {
            return await ExecuteWithPoliciesAsync(async () =>
            {
                try
                {
                    var product = await _apiClient.Products[productId].GetAsync(cancellationToken);
                    _logger.LogInformation("Retrieved product {ProductId}: {ProductName}", 
                        product.Id, product.Name);
                    return product;
                }
                catch (ApiException ex) when (ex.ResponseStatusCode == 404)
                {
                    _logger.LogWarning("Product {ProductId} not found", productId);
                    return null;
                }
            });
        }, TimeSpan.FromMinutes(10));
    }
    
    public async Task<Product> CreateProductAsync(
        CreateProductRequest request, 
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPoliciesAsync(async () =>
        {
            var product = await _apiClient.Products.PostAsync(request, cancellationToken);
            
            _logger.LogInformation("Created product {ProductId}: {ProductName}", 
                product.Id, product.Name);
            
            // Invalidate relevant cache entries
            await InvalidateCacheAsync(new[] { "products_", "categories_" });
            
            return product;
        });
    }
    
    public async Task<Product> UpdateProductAsync(
        string productId, 
        UpdateProductRequest request, 
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPoliciesAsync(async () =>
        {
            var product = await _apiClient.Products[productId].PutAsync(request, cancellationToken);
            
            _logger.LogInformation("Updated product {ProductId}: {ProductName}", 
                product.Id, product.Name);
            
            // Invalidate cache
            await InvalidateCacheAsync(new[] { $"product_{productId}", "products_" });
            
            return product;
        });
    }
    
    public async Task DeleteProductAsync(
        string productId, 
        CancellationToken cancellationToken = default)
    {
        await ExecuteWithPoliciesAsync(async () =>
        {
            await _apiClient.Products[productId].DeleteAsync(cancellationToken);
            
            _logger.LogInformation("Deleted product {ProductId}", productId);
            
            // Invalidate cache
            await InvalidateCacheAsync(new[] { $"product_{productId}", "products_" });
        });
    }
    
    public async Task<IEnumerable<Category>> GetCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        var cacheKey = "categories_all";
        
        return await GetWithCacheAsync(cacheKey, async () =>
        {
            return await ExecuteWithPoliciesAsync(async () =>
            {
                var categories = await _apiClient.Categories.GetAsync(cancellationToken);
                _logger.LogInformation("Retrieved {Count} categories", categories?.Count() ?? 0);
                return categories ?? Enumerable.Empty<Category>();
            });
        }, TimeSpan.FromHours(1));
    }
    
    private async Task<T> ExecuteWithPoliciesAsync<T>(Func<Task<T>> operation)
    {
        return await _circuitBreakerPolicy.ExecuteAsync(async () =>
            await _retryPolicy.ExecuteAsync(operation));
    }
    
    private async Task ExecuteWithPoliciesAsync(Func<Task> operation)
    {
        await _circuitBreakerPolicy.ExecuteAsync(async () =>
            await _retryPolicy.ExecuteAsync(operation));
    }
    
    private async Task<T> GetWithCacheAsync<T>(
        string cacheKey, 
        Func<Task<T>> fetchOperation,
        TimeSpan cacheDuration)
    {
        if (_cache.TryGetValue(cacheKey, out T cachedValue))
        {
            _logger.LogDebug("Cache hit for key: {CacheKey}", cacheKey);
            return cachedValue;
        }
        
        var value = await fetchOperation();
        _cache.Set(cacheKey, value, cacheDuration);
        
        _logger.LogDebug("Cached value for key: {CacheKey}", cacheKey);
        return value;
    }
    
    private async Task InvalidateCacheAsync(string[] keyPrefixes)
    {
        // Implementation depends on cache provider
        // For IMemoryCache, you'd need to track keys separately
        await Task.CompletedTask;
    }
    
    private static bool IsTransientError(int? statusCode) =>
        statusCode is >= 500 or 408 or 429;
}
```

### Dependency Injection Configuration

```csharp
// Extensions/ServiceCollectionExtensions.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Company.Enterprise.ApiClient;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Azure.Identity;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEnterpriseApiClient(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // Configure API client options
        services.Configure<ApiClientOptions>(
            configuration.GetSection("ApiClients:Enterprise"));
        
        // Register HTTP client factory
        services.AddHttpClient<EnterpriseApiClient>((serviceProvider, httpClient) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<ApiClientOptions>>().Value;
            httpClient.BaseAddress = new Uri(options.BaseUrl);
            httpClient.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            
            // Add custom headers
            httpClient.DefaultRequestHeaders.Add("User-Agent", 
                $"EnterpriseApp/{options.Version}");
        })
        .AddPolicyHandler(GetRetryPolicy())
        .AddPolicyHandler(GetCircuitBreakerPolicy());
        
        // Register authentication provider
        services.AddSingleton<IAuthenticationProvider>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<ApiClientOptions>>().Value;
            
            return options.AuthenticationType.ToLower() switch
            {
                "bearer" => new BearerTokenAuthenticationProvider(
                    new DefaultAzureCredential(),
                    options.Scopes?.ToArray() ?? Array.Empty<string>()),
                "apikey" => new ApiKeyAuthenticationProvider(
                    options.ApiKey, options.ApiKeyHeaderName),
                "anonymous" => new AnonymousAuthenticationProvider(),
                _ => throw new InvalidOperationException(
                    $"Unsupported authentication type: {options.AuthenticationType}")
            };
        });
        
        // Register Kiota request adapter
        services.AddScoped<IRequestAdapter>(serviceProvider =>
        {
            var authProvider = serviceProvider.GetRequiredService<IAuthenticationProvider>();
            var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient(nameof(EnterpriseApiClient));
            
            return new HttpClientRequestAdapter(authProvider, httpClient: httpClient);
        });
        
        // Register API client
        services.AddScoped<EnterpriseApiClient>();
        
        // Register service layer
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        
        // Add memory cache
        services.AddMemoryCache();
        
        return services;
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    // Log retry attempt
                });
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => (int)r.StatusCode >= 500)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30));
    }
}

// Models/ApiClientOptions.cs
public class ApiClientOptions
{
    public string BaseUrl { get; set; } = string.Empty;
    public string AuthenticationType { get; set; } = "Bearer";
    public string? ApiKey { get; set; }
    public string ApiKeyHeaderName { get; set; } = "X-API-Key";
    public List<string>? Scopes { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
    public string Version { get; set; } = "1.0.0";
}
```

### Custom Authentication Providers

```csharp
// Authentication/BearerTokenAuthenticationProvider.cs
using Azure.Core;
using Microsoft.Kiota.Abstractions.Authentication;

public class BearerTokenAuthenticationProvider : IAuthenticationProvider
{
    private readonly TokenCredential _credential;
    private readonly string[] _scopes;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private AccessToken? _cachedToken;
    
    public BearerTokenAuthenticationProvider(TokenCredential credential, string[] scopes)
    {
        _credential = credential ?? throw new ArgumentNullException(nameof(credential));
        _scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
    }
    
    public async Task AuthenticateRequestAsync(
        RequestInformation request,
        Dictionary<string, object>? additionalAuthenticationContext = null,
        CancellationToken cancellationToken = default)
    {
        var token = await GetAccessTokenAsync(cancellationToken);
        request.Headers.Add("Authorization", $"Bearer {token}");
    }
    
    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            // Check if cached token is still valid
            if (_cachedToken.HasValue && 
                _cachedToken.Value.ExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
            {
                return _cachedToken.Value.Token;
            }
            
            // Get new token
            var tokenContext = new TokenRequestContext(_scopes);
            _cachedToken = await _credential.GetTokenAsync(tokenContext, cancellationToken);
            
            return _cachedToken.Value.Token;
        }
        finally
        {
            _semaphore.Release();
        }
    }
    
    public void Dispose()
    {
        _semaphore.Dispose();
    }
}

// Authentication/ApiKeyAuthenticationProvider.cs
public class ApiKeyAuthenticationProvider : IAuthenticationProvider
{
    private readonly string _apiKey;
    private readonly string _headerName;
    
    public ApiKeyAuthenticationProvider(string apiKey, string headerName = "X-API-Key")
    {
        _apiKey = apiKey ?? throw new ArgumentNullException(nameof(apiKey));
        _headerName = headerName ?? throw new ArgumentNullException(nameof(headerName));
    }
    
    public Task AuthenticateRequestAsync(
        RequestInformation request,
        Dictionary<string, object>? additionalAuthenticationContext = null,
        CancellationToken cancellationToken = default)
    {
        request.Headers.Add(_headerName, _apiKey);
        return Task.CompletedTask;
    }
}
```

## TypeScript/Node.js Enterprise Integration

### Service Layer Implementation

```typescript
// services/ProductService.ts
import { EnterpriseApiClient } from '../generated/enterprise-client';
import { Product, CreateProductRequest, UpdateProductRequest, PagedResult } from '../generated/models';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';
import NodeCache from 'node-cache';
import pino from 'pino';

interface ServiceOptions {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    cacheOptions?: {
        stdTTL: number;
        checkperiod: number;
    };
}

export class ProductService {
    private client: EnterpriseApiClient;
    private cache: NodeCache;
    private logger: pino.Logger;
    
    constructor(options: ServiceOptions) {
        this.logger = pino({ name: 'ProductService' });
        
        // Setup cache
        this.cache = new NodeCache({
            stdTTL: options.cacheOptions?.stdTTL ?? 300, // 5 minutes
            checkperiod: options.cacheOptions?.checkperiod ?? 60
        });
        
        // Setup authentication
        const authProvider = options.apiKey
            ? new ApiKeyAuthenticationProvider(options.apiKey)
            : new AnonymousAuthenticationProvider();
        
        // Setup HTTP adapter
        const adapter = new FetchRequestAdapter(authProvider);
        adapter.baseUrl = options.baseUrl;
        
        // Initialize client
        this.client = new EnterpriseApiClient(adapter);
    }
    
    async getProducts(options: {
        page?: number;
        pageSize?: number;
        categoryId?: string;
        search?: string;
    } = {}): Promise<PagedResult> {
        const cacheKey = `products_${JSON.stringify(options)}`;
        
        return await this.getWithCache(cacheKey, async () => {
            const requestConfig = {
                queryParameters: {
                    page: options.page ?? 1,
                    pageSize: options.pageSize ?? 20,
                    categoryId: options.categoryId,
                    search: options.search
                }
            };
            
            return await this.executeWithRetry(async () => {
                const result = await this.client.products.get(requestConfig);
                this.logger.info({
                    count: result.data?.length ?? 0,
                    page: result.pagination?.page,
                    totalPages: result.pagination?.totalPages
                }, 'Retrieved products');
                
                return result;
            });
        }, 300); // 5 minutes cache
    }
    
    async getProductById(productId: string): Promise<Product | null> {
        const cacheKey = `product_${productId}`;
        
        return await this.getWithCache(cacheKey, async () => {
            return await this.executeWithRetry(async () => {
                try {
                    const product = await this.client.products.byProductId(productId).get();
                    this.logger.info({ productId, productName: product.name }, 'Retrieved product');
                    return product;
                } catch (error: any) {
                    if (error.responseStatusCode === 404) {
                        this.logger.warn({ productId }, 'Product not found');
                        return null;
                    }
                    throw error;
                }
            });
        }, 600); // 10 minutes cache
    }
    
    async createProduct(request: CreateProductRequest): Promise<Product> {
        return await this.executeWithRetry(async () => {
            const product = await this.client.products.post(request);
            
            this.logger.info({ 
                productId: product.id, 
                productName: product.name 
            }, 'Created product');
            
            // Invalidate cache
            this.invalidateCache(['products_']);
            
            return product;
        });
    }
    
    async updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
        return await this.executeWithRetry(async () => {
            const product = await this.client.products.byProductId(productId).put(request);
            
            this.logger.info({ 
                productId: product.id, 
                productName: product.name 
            }, 'Updated product');
            
            // Invalidate cache
            this.invalidateCache([`product_${productId}`, 'products_']);
            
            return product;
        });
    }
    
    async deleteProduct(productId: string): Promise<void> {
        await this.executeWithRetry(async () => {
            await this.client.products.byProductId(productId).delete();
            
            this.logger.info({ productId }, 'Deleted product');
            
            // Invalidate cache
            this.invalidateCache([`product_${productId}`, 'products_']);
        });
    }
    
    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                
                // Don't retry client errors (4xx)
                if (error.responseStatusCode && error.responseStatusCode < 500) {
                    throw error;
                }
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    this.logger.warn({ 
                        attempt, 
                        delay, 
                        error: error.message 
                    }, 'Retrying operation');
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    this.logger.error({ 
                        attempts: maxRetries, 
                        error: error.message 
                    }, 'Operation failed after retries');
                }
            }
        }
        
        throw lastError!;
    }
    
    private async getWithCache<T>(
        key: string,
        fetchOperation: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.cache.get<T>(key);
        if (cached !== undefined) {
            this.logger.debug({ key }, 'Cache hit');
            return cached;
        }
        
        const value = await fetchOperation();
        this.cache.set(key, value, ttl);
        
        this.logger.debug({ key, ttl }, 'Cached value');
        return value;
    }
    
    private invalidateCache(keyPrefixes: string[]): void {
        const keys = this.cache.keys();
        const toDelete = keys.filter(key => 
            keyPrefixes.some(prefix => key.startsWith(prefix))
        );
        
        if (toDelete.length > 0) {
            this.cache.del(toDelete);
            this.logger.debug({ keys: toDelete }, 'Invalidated cache keys');
        }
    }
}

// Custom API Key Authentication Provider
class ApiKeyAuthenticationProvider {
    constructor(
        private apiKey: string,
        private headerName: string = 'X-API-Key'
    ) {}
    
    async authenticateRequest(
        request: any,
        additionalAuthenticationContext?: Record<string, unknown>
    ): Promise<void> {
        if (!request.headers) {
            request.headers = {};
        }
        request.headers[this.headerName] = this.apiKey;
    }
}
```

### Express.js API Integration

```typescript
// controllers/ProductController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { CreateProductRequest, UpdateProductRequest } from '../generated/models';
import { validationResult } from 'express-validator';

export class ProductController {
    constructor(private productService: ProductService) {}
    
    async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                page = 1,
                pageSize = 20,
                categoryId,
                search
            } = req.query;
            
            const result = await this.productService.getProducts({
                page: Number(page),
                pageSize: Number(pageSize),
                categoryId: categoryId as string,
                search: search as string
            });
            
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }
    
    async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { productId } = req.params;
            const product = await this.productService.getProductById(productId);
            
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
                return;
            }
            
            const createRequest: CreateProductRequest = req.body;
            const product = await this.productService.createProduct(createRequest);
            
            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
                return;
            }
            
            const { productId } = req.params;
            const updateRequest: UpdateProductRequest = req.body;
            
            const product = await this.productService.updateProduct(productId, updateRequest);
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { productId } = req.params;
            await this.productService.deleteProduct(productId);
            
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
```

## Automated CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/kiota-generation.yml
name: 'Kiota Client Generation Pipeline'

on:
  push:
    branches: [main, develop]
    paths: 
      - 'api-specs/**'
      - '.github/workflows/kiota-generation.yml'
  pull_request:
    branches: [main]
    paths: ['api-specs/**']
  workflow_dispatch:
    inputs:
      force_regenerate:
        description: 'Force regenerate all clients'
        required: false
        default: 'false'
        type: boolean

env:
  KIOTA_VERSION: '1.10.1'

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    outputs:
      specs-changed: ${{ steps.changes.outputs.specs }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Check for spec changes
        uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            specs:
              - 'api-specs/**/*.yml'
              - 'api-specs/**/*.yaml'
              - 'api-specs/**/*.json'
      
      - name: Setup .NET
        if: steps.changes.outputs.specs == 'true' || github.event.inputs.force_regenerate == 'true'
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Install Kiota
        if: steps.changes.outputs.specs == 'true' || github.event.inputs.force_regenerate == 'true'
        run: dotnet tool install --global Microsoft.OpenApi.Kiota --version ${{ env.KIOTA_VERSION }}
      
      - name: Validate OpenAPI Specifications
        if: steps.changes.outputs.specs == 'true' || github.event.inputs.force_regenerate == 'true'
        run: |
          echo "🔍 Validating OpenAPI specifications..."
          
          for spec_file in api-specs/*.yml api-specs/*.yaml api-specs/*.json; do
            if [[ -f "$spec_file" ]]; then
              echo "Validating $spec_file"
              kiota validate --openapi "$spec_file"
              
              # Get spec info
              echo "📊 Specification Information:"
              kiota info --openapi "$spec_file"
              echo ""
            fi
          done

  generate-clients:
    needs: validate-specs
    if: needs.validate-specs.outputs.specs-changed == 'true' || github.event.inputs.force_regenerate == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target:
          - name: 'backend-csharp'
            language: 'csharp'
            config: 'kiota-configs/backend-config.yml'
            validation: 'dotnet build ./src/Generated/Backend'
          - name: 'frontend-typescript'
            language: 'typescript' 
            config: 'kiota-configs/frontend-config.yml'
            validation: 'cd ./src/generated/frontend && npm install && npm run build'
          - name: 'mobile-java'
            language: 'java'
            config: 'kiota-configs/mobile-config.yml'
            validation: 'cd ./src/generated/mobile && mvn compile'
          - name: 'cli-go'
            language: 'go'
            config: 'kiota-configs/cli-config.yml'
            validation: 'cd ./src/generated/cli && go mod tidy && go build'
          - name: 'scripts-python'
            language: 'python'
            config: 'kiota-configs/scripts-config.yml'
            validation: 'cd ./src/generated/scripts && python -m py_compile *.py'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Setup Node.js
        if: matrix.target.language == 'typescript'
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Java
        if: matrix.target.language == 'java'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup Go
        if: matrix.target.language == 'go'
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Setup Python
        if: matrix.target.language == 'python'
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Kiota
        run: dotnet tool install --global Microsoft.OpenApi.Kiota --version ${{ env.KIOTA_VERSION }}
      
      - name: Generate ${{ matrix.target.name }} Client
        run: |
          echo "🚀 Generating ${{ matrix.target.name }} client..."
          
          # Clean previous generation
          output_dir=$(grep '^output:' ${{ matrix.target.config }} | awk '{print $2}')
          rm -rf "$output_dir"
          mkdir -p "$output_dir"
          
          # Generate client
          kiota generate --config ${{ matrix.target.config }}
          
          echo "✅ Generated ${{ matrix.target.name }} client"
      
      - name: Validate Generated Code
        run: |
          echo "🔍 Validating generated ${{ matrix.target.name }} client..."
          ${{ matrix.target.validation }}
          echo "✅ Validation completed for ${{ matrix.target.name }}"
      
      - name: Upload Generated Client
        uses: actions/upload-artifact@v4
        with:
          name: 'generated-${{ matrix.target.name }}-client'
          path: |
            ${{ matrix.target.config }}
            src/generated/**
          retention-days: 30
      
      - name: Generate Client Documentation
        run: |
          echo "📝 Generating documentation for ${{ matrix.target.name }}..."
          
          output_dir=$(grep '^output:' ${{ matrix.target.config }} | awk '{print $2}')
          
          # Create README for the generated client
          cat > "${output_dir}/README.md" << EOF
          # Generated API Client - ${{ matrix.target.name }}
          
          Generated on: $(date)
          Kiota Version: ${{ env.KIOTA_VERSION }}
          Language: ${{ matrix.target.language }}
          
          ## Configuration
          
          This client was generated using the following configuration:
          
          \`\`\`yaml
          $(cat ${{ matrix.target.config }})
          \`\`\`
          
          ## Usage
          
          See the main project documentation for usage examples.
          
          ## Validation
          
          This client was validated using: \`${{ matrix.target.validation }}\`
          EOF

  integration-tests:
    needs: [validate-specs, generate-clients]
    if: needs.validate-specs.outputs.specs-changed == 'true' || github.event.inputs.force_regenerate == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Download All Generated Clients
        uses: actions/download-artifact@v4
        with:
          path: ./artifacts
      
      - name: Setup Test Environment
        run: |
          echo "🔧 Setting up integration test environment..."
          
          # Setup .NET
          dotnet --version
          
          # Setup Node.js
          node --version
          npm --version
      
      - name: Run Integration Tests
        run: |
          echo "🧪 Running integration tests..."
          
          # Test C# client compilation
          if [ -d "./artifacts/generated-backend-csharp-client" ]; then
            echo "Testing C# client..."
            cd "./artifacts/generated-backend-csharp-client/src/Generated/Backend"
            dotnet build
            cd -
          fi
          
          # Test TypeScript client compilation
          if [ -d "./artifacts/generated-frontend-typescript-client" ]; then
            echo "Testing TypeScript client..."
            cd "./artifacts/generated-frontend-typescript-client/src/generated/frontend"
            npm install
            npm run build
            cd -
          fi
          
          echo "✅ Integration tests completed"

  create-release:
    needs: [validate-specs, generate-clients, integration-tests]
    if: github.ref == 'refs/heads/main' && (needs.validate-specs.outputs.specs-changed == 'true' || github.event.inputs.force_regenerate == 'true')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Download All Generated Clients
        uses: actions/download-artifact@v4
        with:
          path: ./artifacts
      
      - name: Create Release Archive
        run: |
          echo "📦 Creating release archive..."
          
          # Create release directory structure
          mkdir -p release/{clients,docs,configs}
          
          # Copy generated clients
          cp -r artifacts/*/src/generated/* release/clients/ 2>/dev/null || true
          
          # Copy configurations
          cp kiota-configs/* release/configs/ 2>/dev/null || true
          
          # Create release notes
          cat > release/RELEASE_NOTES.md << EOF
          # API Client Generation Release
          
          Generated on: $(date)
          Commit: ${{ github.sha }}
          Kiota Version: ${{ env.KIOTA_VERSION }}
          
          ## Generated Clients
          
          $(find release/clients -type d -mindepth 1 -maxdepth 1 | sed 's|release/clients/||' | sed 's/^/- /')
          
          ## Changes
          
          ${{ github.event.head_commit.message }}
          EOF
          
          # Create archive
          tar -czf api-clients-$(date +%Y%m%d-%H%M%S).tar.gz -C release .
      
      - name: Upload Release Archive
        uses: actions/upload-artifact@v4
        with:
          name: 'api-clients-release'
          path: '*.tar.gz'
          retention-days: 90
```

## Production Monitoring and Observability

### Telemetry Integration

```csharp
// Telemetry/ApiClientTelemetry.cs
using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.Extensions.Logging;
using Microsoft.Kiota.Abstractions;

public class ApiClientTelemetry : IDisposable
{
    private static readonly ActivitySource ActivitySource = new("Company.Enterprise.ApiClient");
    private static readonly Meter Meter = new("Company.Enterprise.ApiClient");
    
    // Metrics
    private readonly Counter<long> _requestCounter;
    private readonly Histogram<double> _requestDuration;
    private readonly Counter<long> _errorCounter;
    private readonly UpDownCounter<long> _activeRequests;
    
    public ApiClientTelemetry()
    {
        _requestCounter = Meter.CreateCounter<long>("api_requests_total", 
            description: "Total number of API requests");
        
        _requestDuration = Meter.CreateHistogram<double>("api_request_duration_seconds", 
            description: "Duration of API requests in seconds");
        
        _errorCounter = Meter.CreateCounter<long>("api_errors_total", 
            description: "Total number of API errors");
        
        _activeRequests = Meter.CreateUpDownCounter<long>("api_active_requests", 
            description: "Number of active API requests");
    }
    
    public Activity? StartActivity(string operationName, RequestInformation requestInfo)
    {
        var activity = ActivitySource.StartActivity(operationName);
        
        if (activity != null)
        {
            activity.SetTag("http.method", requestInfo.HttpMethod?.ToString());
            activity.SetTag("http.url", requestInfo.URI?.ToString());
            activity.SetTag("api.operation", operationName);
        }
        
        _activeRequests.Add(1);
        
        return activity;
    }
    
    public void RecordRequest(string operationName, string method, int statusCode, double durationSeconds)
    {
        var tags = new TagList
        {
            { "operation", operationName },
            { "method", method },
            { "status_code", statusCode.ToString() }
        };
        
        _requestCounter.Add(1, tags);
        _requestDuration.Record(durationSeconds, tags);
        _activeRequests.Add(-1);
        
        if (statusCode >= 400)
        {
            _errorCounter.Add(1, tags);
        }
    }
    
    public void Dispose()
    {
        ActivitySource.Dispose();
        Meter.Dispose();
    }
}

// Middleware/TelemetryMiddleware.cs
public class TelemetryMiddleware : IMiddleware
{
    private readonly ApiClientTelemetry _telemetry;
    private readonly ILogger<TelemetryMiddleware> _logger;
    
    public TelemetryMiddleware(ApiClientTelemetry telemetry, ILogger<TelemetryMiddleware> logger)
    {
        _telemetry = telemetry;
        _logger = logger;
    }
    
    public async Task<RequestInformation> ProcessAsync(
        RequestInformation request,
        RequestContext context,
        Func<RequestInformation, RequestContext, Task<RequestInformation>> next)
    {
        var operationName = ExtractOperationName(request);
        var stopwatch = Stopwatch.StartNew();
        
        using var activity = _telemetry.StartActivity(operationName, request);
        
        try
        {
            _logger.LogDebug("Starting API request to {Uri}", request.URI);
            
            var response = await next(request, context);
            
            stopwatch.Stop();
            var statusCode = ExtractStatusCode(response);
            
            _telemetry.RecordRequest(
                operationName, 
                request.HttpMethod?.ToString() ?? "UNKNOWN",
                statusCode,
                stopwatch.Elapsed.TotalSeconds);
            
            _logger.LogDebug("API request completed in {ElapsedMs}ms with status {StatusCode}", 
                stopwatch.ElapsedMilliseconds, statusCode);
            
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            
            var statusCode = ExtractStatusCodeFromException(ex);
            _telemetry.RecordRequest(
                operationName,
                request.HttpMethod?.ToString() ?? "UNKNOWN", 
                statusCode,
                stopwatch.Elapsed.TotalSeconds);
            
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            
            _logger.LogError(ex, "API request failed after {ElapsedMs}ms", 
                stopwatch.ElapsedMilliseconds);
            
            throw;
        }
    }
    
    private string ExtractOperationName(RequestInformation request)
    {
        // Extract operation from URI path
        var path = request.URI?.AbsolutePath ?? "unknown";
        var method = request.HttpMethod?.ToString() ?? "unknown";
        return $"{method} {path}";
    }
    
    private int ExtractStatusCode(RequestInformation response)
    {
        // Implementation depends on how status code is available
        return 200; // Placeholder
    }
    
    private int ExtractStatusCodeFromException(Exception ex)
    {
        return ex switch
        {
            ApiException apiEx => apiEx.ResponseStatusCode ?? 500,
            HttpRequestException => 500,
            TaskCanceledException => 408,
            _ => 500
        };
    }
}
```

## Performance Optimization Strategies

### Connection Pooling and HTTP Configuration

```csharp
// Configuration/HttpClientConfiguration.cs
public static class HttpClientConfiguration
{
    public static IServiceCollection ConfigureHttpClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure HTTP client factory with connection pooling
        services.AddHttpClient<EnterpriseApiClient>((serviceProvider, httpClient) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<ApiClientOptions>>().Value;
            
            // Basic configuration
            httpClient.BaseAddress = new Uri(options.BaseUrl);
            httpClient.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            
            // Performance headers
            httpClient.DefaultRequestHeaders.Add("Keep-Alive", "true");
            httpClient.DefaultRequestHeaders.Add("Connection", "keep-alive");
            httpClient.DefaultRequestHeaders.Add("User-Agent", 
                $"EnterpriseApp/{options.Version} (.NET/{Environment.Version})");
            
            // Compression
            httpClient.DefaultRequestHeaders.AcceptEncoding.Add(
                new System.Net.Http.Headers.StringWithQualityHeaderValue("gzip"));
            httpClient.DefaultRequestHeaders.AcceptEncoding.Add(
                new System.Net.Http.Headers.StringWithQualityHeaderValue("deflate"));
            
        })
        .ConfigurePrimaryHttpMessageHandler((serviceProvider) =>
        {
            var handler = new HttpClientHandler();
            
            // Connection pooling settings
            handler.MaxConnectionsPerServer = 10;
            handler.PooledConnectionLifetime = TimeSpan.FromMinutes(2);
            handler.PooledConnectionIdleTimeout = TimeSpan.FromSeconds(30);
            
            // Compression
            handler.AutomaticDecompression = 
                DecompressionMethods.GZip | DecompressionMethods.Deflate;
            
            return handler;
        })
        .AddPolicyHandler(GetRetryPolicy())
        .AddPolicyHandler(GetCircuitBreakerPolicy())
        .AddPolicyHandler(GetTimeoutPolicy());
        
        return services;
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy()
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(30));
    }
}
```

This comprehensive guide demonstrates how Microsoft Kiota transforms OpenAPI specifications into enterprise-ready API clients. The examples show production-ready patterns for authentication, error handling, caching, monitoring, and CI/CD integration across multiple programming languages.

The implementation strategies ensure scalable, maintainable, and observable API integrations that meet enterprise requirements while leveraging Kiota's code generation capabilities to reduce development time and improve code quality.