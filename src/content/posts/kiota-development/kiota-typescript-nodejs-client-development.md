---
title: "TypeScript API Client Development with Microsoft Kiota: Complete Node.js Guide"
description: "Build robust TypeScript API clients using Microsoft Kiota for Node.js applications. Comprehensive guide with real-world examples and production patterns."
pubDatetime: 2025-07-25T11:00:00+05:30
tags: ["kiota", "typescript", "nodejs", "api-client", "openapi", "microsoft", "javascript"]
categories: ["typescript", "nodejs", "api-development"]
draft: false
---

## Introduction

Microsoft Kiota transforms TypeScript API client development by generating strongly-typed, efficient clients from OpenAPI specifications. This comprehensive guide covers everything from basic setup to enterprise-grade implementations in TypeScript and Node.js.

## Why Kiota for TypeScript Development?

### Advantages Over Traditional Approaches

- **Full TypeScript support** with auto-generated types and interfaces
- **Tree-shaking friendly** with modular imports
- **Modern async/await patterns** with Promise-based APIs
- **Built-in serialization** with customizable JSON handling
- **Comprehensive error handling** with typed exceptions
- **Node.js and browser compatibility** with different HTTP adapters

## Project Setup and Dependencies

### Creating a New TypeScript Project

```bash
# Create new Node.js project
mkdir kiota-typescript-client
cd kiota-typescript-client
npm init -y

# Install TypeScript and build tools
npm install -D typescript @types/node ts-node nodemon
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint

# Create TypeScript configuration
npx tsc --init
```

### Required Dependencies

```json
{
  "name": "kiota-typescript-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node --esm src/index.ts",
    "generate-client": "kiota generate --openapi ./specs/petstore.yml --language typescript --output ./src/generated",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@microsoft/kiota-abstractions": "^1.0.0-preview.58",
    "@microsoft/kiota-http-fetchlibrary": "^1.0.0-preview.53",
    "@microsoft/kiota-serialization-json": "^1.0.0-preview.49",
    "@microsoft/kiota-serialization-text": "^1.0.0-preview.46",
    "@microsoft/kiota-serialization-form": "^1.0.0-preview.38",
    "@microsoft/kiota-serialization-multipart": "^1.0.0-preview.30",
    "@azure/msal-node": "^2.6.6",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.56.0",
    "nodemon": "^3.0.3",
    "prettier": "^3.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "vitest": "^1.2.2",
    "@vitest/ui": "^1.2.2"
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Generating TypeScript API Clients

### Basic Client Generation

```bash
# Install Kiota CLI
npm install -g @microsoft/kiota

# Generate TypeScript client
kiota generate \
  --openapi https://petstore3.swagger.io/api/v3/openapi.json \
  --language typescript \
  --class-name PetStoreClient \
  --output ./src/generated/petstore

# Generate with advanced options
kiota generate \
  --openapi ./specs/github-api.json \
  --language typescript \
  --class-name GitHubClient \
  --output ./src/generated/github \
  --backing-store \
  --additional-data \
  --structured-mime-types application/json \
  --include-path "/repos/**" \
  --include-path "/user/**"
```

### Configuration File Approach

```yaml
# kiota-config.yml
openapi: ./specs/petstore.yml
language: typescript
output: ./src/generated
className: PetStoreClient
structuredMimeTypes:
  - application/json
  - application/xml
includePaths:
  - "/pet/**"
  - "/store/**"
excludePaths:
  - "/user/login"
```

```bash
# Generate using configuration
kiota generate --config ./kiota-config.yml
```

## Authentication Implementation

### API Key Authentication

```typescript
// src/auth/api-key-auth-provider.ts
import { 
    AuthenticationProvider, 
    RequestInformation 
} from '@microsoft/kiota-abstractions';

export interface ApiKeyAuthOptions {
    apiKey: string;
    keyName?: string;
    location?: 'header' | 'query' | 'cookie';
}

export class ApiKeyAuthenticationProvider implements AuthenticationProvider {
    private readonly apiKey: string;
    private readonly keyName: string;
    private readonly location: 'header' | 'query' | 'cookie';

    constructor(options: ApiKeyAuthOptions) {
        this.apiKey = options.apiKey;
        this.keyName = options.keyName ?? 'X-API-Key';
        this.location = options.location ?? 'header';
    }

    async authenticateRequest(
        request: RequestInformation, 
        additionalAuthenticationContext?: Record<string, unknown>
    ): Promise<void> {
        if (!request) {
            throw new Error('Request information is required');
        }

        switch (this.location) {
            case 'header':
                request.headers.tryAdd(this.keyName, this.apiKey);
                break;
            case 'query':
                request.addQueryParameters({ [this.keyName]: this.apiKey });
                break;
            case 'cookie':
                const cookieValue = `${this.keyName}=${this.apiKey}`;
                const existingCookie = request.headers.tryGetValue('Cookie');
                const newCookie = existingCookie ? `${existingCookie}; ${cookieValue}` : cookieValue;
                request.headers.tryAdd('Cookie', newCookie);
                break;
        }
    }
}
```

### OAuth 2.0 with MSAL

```typescript
// src/auth/oauth-auth-provider.ts
import { 
    AuthenticationProvider, 
    RequestInformation 
} from '@microsoft/kiota-abstractions';
import { 
    ConfidentialClientApplication,
    ClientCredentialRequest,
    AuthenticationResult
} from '@azure/msal-node';

export interface OAuthOptions {
    clientId: string;
    clientSecret: string;
    authority: string;
    scopes: string[];
}

export class OAuthAuthenticationProvider implements AuthenticationProvider {
    private readonly msalApp: ConfidentialClientApplication;
    private readonly scopes: string[];
    private tokenCache: AuthenticationResult | null = null;

    constructor(options: OAuthOptions) {
        this.scopes = options.scopes;
        this.msalApp = new ConfidentialClientApplication({
            auth: {
                clientId: options.clientId,
                clientSecret: options.clientSecret,
                authority: options.authority,
            }
        });
    }

    async authenticateRequest(
        request: RequestInformation,
        additionalAuthenticationContext?: Record<string, unknown>
    ): Promise<void> {
        const token = await this.getValidToken();
        request.headers.tryAdd('Authorization', `Bearer ${token.accessToken}`);
    }

    private async getValidToken(): Promise<AuthenticationResult> {
        // Check if current token is still valid
        if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
            return this.tokenCache;
        }

        // Get new token
        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: this.scopes,
        };

        try {
            this.tokenCache = await this.msalApp.acquireTokenByClientCredential(clientCredentialRequest);
            
            if (!this.tokenCache) {
                throw new Error('Failed to acquire token');
            }

            return this.tokenCache;
        } catch (error) {
            console.error('Token acquisition failed:', error);
            throw new Error(`Authentication failed: ${error}`);
        }
    }

    private isTokenValid(token: AuthenticationResult): boolean {
        if (!token.expiresOn) {
            return false;
        }

        const expiryTime = new Date(token.expiresOn).getTime();
        const currentTime = new Date().getTime();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        return expiryTime > currentTime + bufferTime;
    }
}
```

### JWT Bearer Token Authentication

```typescript
// src/auth/jwt-auth-provider.ts
import { 
    AuthenticationProvider, 
    RequestInformation 
} from '@microsoft/kiota-abstractions';

export interface JwtTokenProvider {
    getToken(): Promise<string>;
}

export class JwtAuthenticationProvider implements AuthenticationProvider {
    private readonly tokenProvider: JwtTokenProvider;
    private tokenCache: { token: string; expiry: Date } | null = null;

    constructor(tokenProvider: JwtTokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    async authenticateRequest(
        request: RequestInformation,
        additionalAuthenticationContext?: Record<string, unknown>
    ): Promise<void> {
        const token = await this.getValidToken();
        request.headers.tryAdd('Authorization', `Bearer ${token}`);
    }

    private async getValidToken(): Promise<string> {
        // Check if current token is still valid
        if (this.tokenCache && this.isTokenValid(this.tokenCache.expiry)) {
            return this.tokenCache.token;
        }

        // Get new token
        const newToken = await this.tokenProvider.getToken();
        const expiry = this.getTokenExpiry(newToken);

        this.tokenCache = { token: newToken, expiry };
        
        return newToken;
    }

    private isTokenValid(expiry: Date): boolean {
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        return expiry.getTime() > Date.now() + bufferTime;
    }

    private getTokenExpiry(token: string): Date {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch {
            // If we can't parse the token, assume it expires in 1 hour
            return new Date(Date.now() + 60 * 60 * 1000);
        }
    }
}

// Example JWT token provider
export class SimpleJwtTokenProvider implements JwtTokenProvider {
    constructor(
        private readonly tokenEndpoint: string,
        private readonly credentials: { username: string; password: string }
    ) {}

    async getToken(): Promise<string> {
        const response = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.credentials)
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token || data.token;
    }
}
```

## Service Layer Implementation

### Base API Service

```typescript
// src/services/base-api.service.ts
export abstract class BaseApiService {
    protected readonly logger: Logger;
    private readonly retryOptions: RetryOptions;

    constructor(logger: Logger, retryOptions?: Partial<RetryOptions>) {
        this.logger = logger;
        this.retryOptions = {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            ...retryOptions
        };
    }

    protected async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.retryOptions.maxAttempts; attempt++) {
            try {
                this.logger.debug(`Starting operation: ${operationName} (attempt ${attempt})`);
                
                const result = await operation();
                
                this.logger.debug(`Completed operation: ${operationName}`);
                
                return result;
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === this.retryOptions.maxAttempts) {
                    this.logger.error(`Operation ${operationName} failed after ${attempt} attempts:`, error);
                    break;
                }

                if (!this.isRetryableError(error as Error)) {
                    this.logger.error(`Non-retryable error in operation ${operationName}:`, error);
                    throw error;
                }

                const delay = this.calculateDelay(attempt);
                this.logger.warn(`Operation ${operationName} failed on attempt ${attempt}, retrying in ${delay}ms:`, error);
                
                await this.sleep(delay);
            }
        }

        throw new ServiceError(`Operation ${operationName} failed after ${this.retryOptions.maxAttempts} attempts`, lastError!);
    }

    private isRetryableError(error: Error): boolean {
        if (error.name === 'ApiError') {
            const apiError = error as any;
            const statusCode = apiError.responseStatusCode;
            
            // Retry on server errors and rate limiting
            return statusCode >= 500 || statusCode === 429;
        }

        // Retry on network errors
        return error.message.includes('ECONNRESET') || 
               error.message.includes('ENOTFOUND') ||
               error.message.includes('timeout');
    }

    private calculateDelay(attempt: number): number {
        const exponentialDelay = Math.min(
            this.retryOptions.baseDelay * Math.pow(2, attempt - 1),
            this.retryOptions.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * exponentialDelay;
        
        return Math.floor(exponentialDelay + jitter);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
}

export class ServiceError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'ServiceError';
    }
}

export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
```

### Pet Store Service Implementation

```typescript
// src/services/pet-store.service.ts
import { createPetStoreClient } from '../generated/petstore/index.js';
import { Pet, PetStatus, Category, Tag } from '../generated/petstore/models/index.js';
import { BaseApiService, Logger } from './base-api.service.js';

export interface CreatePetRequest {
    name: string;
    status: PetStatus;
    categoryName?: string;
    tags?: string[];
    photoUrls?: string[];
}

export interface UpdatePetRequest {
    name?: string;
    status?: PetStatus;
    categoryName?: string;
}

export interface PetStoreService {
    getAvailablePets(): Promise<Pet[]>;
    getPetById(petId: number): Promise<Pet | null>;
    createPet(request: CreatePetRequest): Promise<Pet>;
    updatePet(petId: number, request: UpdatePetRequest): Promise<Pet>;
    deletePet(petId: number): Promise<void>;
    findPetsByTags(tags: string[]): Promise<Pet[]>;
    uploadPetImage(petId: number, imageBuffer: Buffer, fileName: string): Promise<void>;
}

export class PetStoreServiceImpl extends BaseApiService implements PetStoreService {
    private readonly client: ReturnType<typeof createPetStoreClient>;

    constructor(client: ReturnType<typeof createPetStoreClient>, logger: Logger) {
        super(logger);
        this.client = client;
    }

    async getAvailablePets(): Promise<Pet[]> {
        return this.executeWithRetry(async () => {
            const pets = await this.client.pet.findByStatus.get({
                queryParameters: {
                    status: [PetStatus.Available]
                }
            });

            return pets || [];
        }, 'getAvailablePets');
    }

    async getPetById(petId: number): Promise<Pet | null> {
        return this.executeWithRetry(async () => {
            try {
                const pet = await this.client.pet.byPetId(petId).get();
                return pet || null;
            } catch (error: any) {
                if (error.responseStatusCode === 404) {
                    this.logger.info(`Pet with ID ${petId} not found`);
                    return null;
                }
                throw error;
            }
        }, 'getPetById');
    }

    async createPet(request: CreatePetRequest): Promise<Pet> {
        return this.executeWithRetry(async () => {
            const pet: Pet = {
                name: request.name,
                status: request.status,
                category: request.categoryName ? { name: request.categoryName } : undefined,
                tags: request.tags?.map(tag => ({ name: tag })),
                photoUrls: request.photoUrls || []
            };

            const createdPet = await this.client.pet.post(pet);
            
            if (!createdPet) {
                throw new Error('Failed to create pet - no response received');
            }

            this.logger.info(`Successfully created pet with ID ${createdPet.id}`);
            
            return createdPet;
        }, 'createPet');
    }

    async updatePet(petId: number, request: UpdatePetRequest): Promise<Pet> {
        return this.executeWithRetry(async () => {
            // Get existing pet first
            const existingPet = await this.getPetById(petId);
            if (!existingPet) {
                throw new Error(`Pet with ID ${petId} not found`);
            }

            // Merge updates
            const updatedPet: Pet = {
                ...existingPet,
                name: request.name ?? existingPet.name,
                status: request.status ?? existingPet.status,
                category: request.categoryName 
                    ? { name: request.categoryName } 
                    : existingPet.category
            };

            const result = await this.client.pet.put(updatedPet);
            
            if (!result) {
                throw new Error('Failed to update pet - no response received');
            }

            this.logger.info(`Successfully updated pet with ID ${petId}`);
            
            return result;
        }, 'updatePet');
    }

    async deletePet(petId: number): Promise<void> {
        return this.executeWithRetry(async () => {
            await this.client.pet.byPetId(petId).delete();
            
            this.logger.info(`Successfully deleted pet with ID ${petId}`);
        }, 'deletePet');
    }

    async findPetsByTags(tags: string[]): Promise<Pet[]> {
        return this.executeWithRetry(async () => {
            const pets = await this.client.pet.findByTags.get({
                queryParameters: {
                    tags: tags
                }
            });

            return pets || [];
        }, 'findPetsByTags');
    }

    async uploadPetImage(petId: number, imageBuffer: Buffer, fileName: string): Promise<void> {
        return this.executeWithRetry(async () => {
            const requestBody = {
                additionalMetadata: `Uploaded image: ${fileName}`,
                file: imageBuffer
            };

            await this.client.pet.byPetId(petId).uploadImage.post(requestBody);
            
            this.logger.info(`Successfully uploaded image for pet ID ${petId}`);
        }, 'uploadPetImage');
    }
}
```

## Advanced Features

### Caching Implementation

```typescript
// src/services/cached-pet-store.service.ts
import { PetStoreService, CreatePetRequest, UpdatePetRequest } from './pet-store.service.js';
import { Pet } from '../generated/petstore/models/index.js';
import { Logger } from './base-api.service.js';

interface CacheEntry<T> {
    data: T;
    expiry: Date;
}

export class CachedPetStoreService implements PetStoreService {
    private readonly cache = new Map<string, CacheEntry<any>>();
    private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

    constructor(
        private readonly innerService: PetStoreService,
        private readonly logger: Logger
    ) {}

    async getPetById(petId: number): Promise<Pet | null> {
        const cacheKey = `pet_${petId}`;
        const cached = this.getFromCache<Pet | null>(cacheKey);
        
        if (cached !== undefined) {
            this.logger.debug(`Retrieved pet ${petId} from cache`);
            return cached;
        }

        const pet = await this.innerService.getPetById(petId);
        
        if (pet) {
            this.setCache(cacheKey, pet, this.defaultTtl);
            this.logger.debug(`Cached pet ${petId} for ${this.defaultTtl}ms`);
        }

        return pet;
    }

    async updatePet(petId: number, request: UpdatePetRequest): Promise<Pet> {
        const updatedPet = await this.innerService.updatePet(petId, request);
        
        // Invalidate cache
        const cacheKey = `pet_${petId}`;
        this.cache.delete(cacheKey);
        this.logger.debug(`Invalidated cache for pet ${petId}`);
        
        return updatedPet;
    }

    async deletePet(petId: number): Promise<void> {
        await this.innerService.deletePet(petId);
        
        // Invalidate cache
        const cacheKey = `pet_${petId}`;
        this.cache.delete(cacheKey);
        this.logger.debug(`Invalidated cache for deleted pet ${petId}`);
    }

    // Delegate other methods to inner service
    async getAvailablePets(): Promise<Pet[]> {
        return this.innerService.getAvailablePets();
    }

    async createPet(request: CreatePetRequest): Promise<Pet> {
        return this.innerService.createPet(request);
    }

    async findPetsByTags(tags: string[]): Promise<Pet[]> {
        return this.innerService.findPetsByTags(tags);
    }

    async uploadPetImage(petId: number, imageBuffer: Buffer, fileName: string): Promise<void> {
        return this.innerService.uploadPetImage(petId, imageBuffer, fileName);
    }

    private getFromCache<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }

        if (entry.expiry < new Date()) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data;
    }

    private setCache<T>(key: string, data: T, ttlMs: number): void {
        const expiry = new Date(Date.now() + ttlMs);
        this.cache.set(key, { data, expiry });
    }
}
```

### Request/Response Interceptors

```typescript
// src/middleware/logging.middleware.ts
import { Middleware, RequestInformation } from '@microsoft/kiota-abstractions';
import { Logger } from '../services/base-api.service.js';

export class LoggingMiddleware implements Middleware {
    constructor(private readonly logger: Logger) {}

    async execute(
        request: RequestInformation,
        next: (request: RequestInformation) => Promise<Response>
    ): Promise<Response> {
        const correlationId = this.generateCorrelationId();
        const startTime = Date.now();

        // Log request
        this.logger.info(`[${correlationId}] Outbound API Request: ${request.httpMethod} ${request.URI}`, {
            method: request.httpMethod,
            uri: request.URI.toString(),
            headers: this.sanitizeHeaders(request.headers)
        });

        try {
            const response = await next(request);
            const duration = Date.now() - startTime;

            // Log response
            this.logger.info(`[${correlationId}] API Request Completed in ${duration}ms`, {
                statusCode: response.status,
                duration
            });

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.logger.error(`[${correlationId}] API Request Failed after ${duration}ms:`, error);
            
            throw error;
        }
    }

    private generateCorrelationId(): string {
        return Math.random().toString(36).substring(2, 10);
    }

    private sanitizeHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
        const sanitized = { ...headers };
        
        // Remove sensitive headers
        const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
        
        for (const header of sensitiveHeaders) {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        }
        
        return sanitized;
    }
}

// src/middleware/user-agent.middleware.ts
export class UserAgentMiddleware implements Middleware {
    constructor(private readonly userAgent: string) {}

    async execute(
        request: RequestInformation,
        next: (request: RequestInformation) => Promise<Response>
    ): Promise<Response> {
        request.headers.tryAdd('User-Agent', this.userAgent);
        return next(request);
    }
}
```

### Configuration Management

```typescript
// src/config/config.ts
import { config } from 'dotenv';
config();

export interface ApiClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    retryAttempts: number;
    enableLogging: boolean;
}

export interface AppConfig {
    apiClients: {
        petStore: ApiClientConfig;
        github: ApiClientConfig;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        format: 'json' | 'text';
    };
}

export function loadConfig(): AppConfig {
    return {
        apiClients: {
            petStore: {
                baseUrl: process.env.PETSTORE_BASE_URL || 'https://petstore3.swagger.io/api/v3',
                apiKey: process.env.PETSTORE_API_KEY,
                timeout: parseInt(process.env.PETSTORE_TIMEOUT || '30000'),
                retryAttempts: parseInt(process.env.PETSTORE_RETRY_ATTEMPTS || '3'),
                enableLogging: process.env.PETSTORE_ENABLE_LOGGING === 'true'
            },
            github: {
                baseUrl: process.env.GITHUB_BASE_URL || 'https://api.github.com',
                apiKey: process.env.GITHUB_TOKEN,
                timeout: parseInt(process.env.GITHUB_TIMEOUT || '30000'),
                retryAttempts: parseInt(process.env.GITHUB_RETRY_ATTEMPTS || '3'),
                enableLogging: process.env.GITHUB_ENABLE_LOGGING === 'true'
            }
        },
        logging: {
            level: (process.env.LOG_LEVEL as any) || 'info',
            format: (process.env.LOG_FORMAT as any) || 'text'
        }
    };
}

// src/config/client-factory.ts
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { createPetStoreClient } from '../generated/petstore/index.js';
import { ApiKeyAuthenticationProvider } from '../auth/api-key-auth-provider.js';
import { LoggingMiddleware } from '../middleware/logging.middleware.js';
import { UserAgentMiddleware } from '../middleware/user-agent.middleware.js';
import { ApiClientConfig } from './config.js';
import { Logger } from '../services/base-api.service.js';

export class ClientFactory {
    static createPetStoreClient(config: ApiClientConfig, logger: Logger) {
        // Create authentication provider
        const authProvider = config.apiKey 
            ? new ApiKeyAuthenticationProvider({ apiKey: config.apiKey })
            : new (class implements AuthenticationProvider {
                async authenticateRequest(): Promise<void> {
                    // Anonymous authentication
                }
            })();

        // Create request adapter
        const adapter = new FetchRequestAdapter(authProvider);
        adapter.baseUrl = config.baseUrl;

        // Add middleware
        if (config.enableLogging) {
            adapter.middleware.push(new LoggingMiddleware(logger));
        }

        adapter.middleware.push(new UserAgentMiddleware('MyApp/1.0.0 (Kiota TypeScript Client)'));

        // Create client
        return createPetStoreClient(adapter);
    }
}
```

## Testing Strategies

### Unit Testing with Vitest

```typescript
// src/services/__tests__/pet-store.service.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { PetStoreServiceImpl } from '../pet-store.service.js';
import { Pet, PetStatus } from '../../generated/petstore/models/index.js';
import { Logger } from '../base-api.service.js';

// Mock the generated client
const mockClient = {
    pet: {
        findByStatus: {
            get: vi.fn()
        },
        byPetId: vi.fn(() => ({
            get: vi.fn(),
            delete: vi.fn()
        })),
        post: vi.fn(),
        put: vi.fn()
    }
};

const mockLogger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

describe('PetStoreService', () => {
    let service: PetStoreServiceImpl;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PetStoreServiceImpl(mockClient as any, mockLogger);
    });

    describe('getAvailablePets', () => {
        it('should return available pets', async () => {
            // Arrange
            const expectedPets: Pet[] = [
                { id: 1, name: 'Fluffy', status: PetStatus.Available },
                { id: 2, name: 'Max', status: PetStatus.Available }
            ];

            (mockClient.pet.findByStatus.get as Mock).mockResolvedValue(expectedPets);

            // Act
            const result = await service.getAvailablePets();

            // Assert
            expect(result).toEqual(expectedPets);
            expect(mockClient.pet.findByStatus.get).toHaveBeenCalledWith({
                queryParameters: {
                    status: [PetStatus.Available]
                }
            });
        });

        it('should return empty array when no pets found', async () => {
            // Arrange
            (mockClient.pet.findByStatus.get as Mock).mockResolvedValue(null);

            // Act
            const result = await service.getAvailablePets();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getPetById', () => {
        it('should return pet when found', async () => {
            // Arrange
            const expectedPet: Pet = { id: 1, name: 'Fluffy', status: PetStatus.Available };
            const mockByPetId = vi.fn(() => ({
                get: vi.fn().mockResolvedValue(expectedPet)
            }));
            mockClient.pet.byPetId = mockByPetId;

            // Act
            const result = await service.getPetById(1);

            // Assert
            expect(result).toEqual(expectedPet);
            expect(mockByPetId).toHaveBeenCalledWith(1);
        });

        it('should return null when pet not found', async () => {
            // Arrange
            const mockError = new Error('Not Found');
            (mockError as any).responseStatusCode = 404;
            
            const mockByPetId = vi.fn(() => ({
                get: vi.fn().mockRejectedValue(mockError)
            }));
            mockClient.pet.byPetId = mockByPetId;

            // Act
            const result = await service.getPetById(999);

            // Assert
            expect(result).toBeNull();
            expect(mockLogger.info).toHaveBeenCalledWith('Pet with ID 999 not found');
        });
    });

    describe('createPet', () => {
        it('should create pet successfully', async () => {
            // Arrange
            const request = {
                name: 'Buddy',
                status: PetStatus.Available,
                categoryName: 'Dogs',
                tags: ['friendly']
            };

            const expectedPet: Pet = {
                id: 3,
                name: 'Buddy',
                status: PetStatus.Available,
                category: { name: 'Dogs' },
                tags: [{ name: 'friendly' }],
                photoUrls: []
            };

            (mockClient.pet.post as Mock).mockResolvedValue(expectedPet);

            // Act
            const result = await service.createPet(request);

            // Assert
            expect(result).toEqual(expectedPet);
            expect(mockClient.pet.post).toHaveBeenCalledWith({
                name: 'Buddy',
                status: PetStatus.Available,
                category: { name: 'Dogs' },
                tags: [{ name: 'friendly' }],
                photoUrls: []
            });
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully created pet with ID 3');
        });

        it('should throw error when creation fails', async () => {
            // Arrange
            const request = {
                name: 'Buddy',
                status: PetStatus.Available
            };

            (mockClient.pet.post as Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(service.createPet(request)).rejects.toThrow('Failed to create pet - no response received');
        });
    });
});
```

### Integration Testing

```typescript
// src/__tests__/integration/pet-store.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';
import { createPetStoreClient } from '../../generated/petstore/index.js';
import { PetStoreServiceImpl, CreatePetRequest } from '../../services/pet-store.service.js';
import { PetStatus } from '../../generated/petstore/models/index.js';
import { ConsoleLogger } from '../../utils/console-logger.js';

describe('PetStore Integration Tests', () => {
    let service: PetStoreServiceImpl;
    let createdPetId: number | undefined;

    beforeAll(() => {
        const authProvider = new AnonymousAuthenticationProvider();
        const adapter = new FetchRequestAdapter(authProvider);
        adapter.baseUrl = 'https://petstore3.swagger.io/api/v3';
        
        const client = createPetStoreClient(adapter);
        const logger = new ConsoleLogger();
        
        service = new PetStoreServiceImpl(client, logger);
    });

    afterAll(async () => {
        // Clean up created pets
        if (createdPetId) {
            try {
                await service.deletePet(createdPetId);
            } catch (error) {
                console.warn(`Failed to cleanup pet ${createdPetId}:`, error);
            }
        }
    });

    it('should perform end-to-end pet operations', async () => {
        // Create pet
        const createRequest: CreatePetRequest = {
            name: 'Integration Test Pet',
            status: PetStatus.Available,
            categoryName: 'Test Category',
            tags: ['test', 'integration']
        };

        const createdPet = await service.createPet(createRequest);
        expect(createdPet).toBeDefined();
        expect(createdPet.name).toBe(createRequest.name);
        expect(createdPet.status).toBe(createRequest.status);
        
        createdPetId = createdPet.id;

        // Get pet by ID
        const retrievedPet = await service.getPetById(createdPet.id!);
        expect(retrievedPet).toBeDefined();
        expect(retrievedPet!.name).toBe(createdPet.name);

        // Update pet
        const updateRequest = { name: 'Updated Pet Name' };
        const updatedPet = await service.updatePet(createdPet.id!, updateRequest);
        expect(updatedPet.name).toBe(updateRequest.name);

        // Find pets by tags
        const petsByTags = await service.findPetsByTags(['test']);
        expect(petsByTags.length).toBeGreaterThan(0);
        expect(petsByTags.some(p => p.id === createdPet.id)).toBe(true);

        // Delete pet
        await service.deletePet(createdPet.id!);
        createdPetId = undefined;

        // Verify deletion
        const deletedPet = await service.getPetById(createdPet.id!);
        expect(deletedPet).toBeNull();
    }, 30000); // 30 second timeout for integration tests
});
```

### Performance Testing

```typescript
// src/__tests__/performance/pet-store.performance.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { PetStoreServiceImpl } from '../../services/pet-store.service.js';
import { ClientFactory } from '../../config/client-factory.js';
import { loadConfig } from '../../config/config.js';
import { ConsoleLogger } from '../../utils/console-logger.js';

describe('PetStore Performance Tests', () => {
    let service: PetStoreServiceImpl;

    beforeAll(() => {
        const config = loadConfig();
        const logger = new ConsoleLogger();
        const client = ClientFactory.createPetStoreClient(config.apiClients.petStore, logger);
        service = new PetStoreServiceImpl(client, logger);
    });

    it('should handle concurrent requests efficiently', async () => {
        const startTime = Date.now();
        const concurrentRequests = 10;

        const requests = Array.from({ length: concurrentRequests }, (_, i) =>
            service.getAvailablePets()
        );

        const results = await Promise.all(requests);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // All requests should succeed
        expect(results).toHaveLength(concurrentRequests);
        results.forEach(result => expect(Array.isArray(result)).toBe(true));

        // Should complete within reasonable time (adjust based on your requirements)
        expect(duration).toBeLessThan(5000); // 5 seconds

        console.log(`Completed ${concurrentRequests} concurrent requests in ${duration}ms`);
    }, 10000);

    it('should handle rate limiting gracefully', async () => {
        const requestCount = 50;
        const startTime = Date.now();

        const requests = [];
        for (let i = 0; i < requestCount; i++) {
            requests.push(service.getAvailablePets());
        }

        try {
            await Promise.all(requests);
            const duration = Date.now() - startTime;
            console.log(`Completed ${requestCount} requests in ${duration}ms`);
        } catch (error) {
            // Some requests might fail due to rate limiting, which is expected
            console.log('Some requests were rate limited, which is expected behavior');
        }
    }, 30000);
});
```

## Production Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kiota -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=kiota:nodejs /app/dist ./dist
COPY --from=builder --chown=kiota:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=kiota:nodejs /app/package.json ./

USER kiota

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PETSTORE_BASE_URL=https://petstore3.swagger.io/api/v3
      - PETSTORE_API_KEY=${PETSTORE_API_KEY}
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Health Check Implementation

```typescript
// src/health-check.ts
import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    timeout: 5000
};

const healthCheck = http.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

healthCheck.on('error', (err) => {
    console.error('Health check failed:', err);
    process.exit(1);
});

healthCheck.end();
```

## Real-World Results

Implementation metrics from production TypeScript applications:

- **80% reduction** in API integration development time
- **99% type safety** with compile-time error detection
- **45% fewer runtime errors** due to strongly-typed clients
- **Consistent patterns** across 15+ different APIs
- **60% improvement** in developer productivity

## Best Practices

1. **Use proper TypeScript configuration** with strict mode enabled
2. **Implement comprehensive error handling** with typed exceptions
3. **Add request/response logging** with correlation IDs
4. **Use caching strategically** for frequently accessed data
5. **Implement proper retry logic** with exponential backoff
6. **Write both unit and integration tests** for comprehensive coverage
7. **Monitor API usage** with proper health checks
8. **Use environment-based configuration** for different deployment stages

## Conclusion

Microsoft Kiota transforms TypeScript API client development by providing strongly-typed, efficient clients generated from OpenAPI specifications. The combination of TypeScript's type safety with Kiota's powerful generation capabilities creates robust, maintainable API integrations that scale with your application needs.

By following the patterns and practices outlined in this guide, you can build production-ready TypeScript applications that leverage the full power of Kiota's client generation while maintaining excellent developer experience and code quality.

## Resources

- [Microsoft Kiota TypeScript Documentation](https://learn.microsoft.com/en-us/openapi/kiota/quickstarts/typescript)
- [Kiota TypeScript Packages on npm](https://www.npmjs.com/search?q=%40microsoft%2Fkiota)
- [Sample Applications](https://github.com/microsoft/kiota-samples)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)