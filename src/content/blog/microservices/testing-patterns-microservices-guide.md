---
title: "Complete Guide to Testing Patterns in Microservices Architecture"
description: "Master microservices testing with comprehensive patterns, strategies, and practical examples using Jest, TestContainers, Pact, and modern testing tools"
slug: "testing-patterns-microservices-guide"
pubDatetime: 2025-01-28T16:00:00+05:30
author: "Anubhav Gain"
tags:
  [
    "microservices",
    "testing",
    "jest",
    "pact",
    "testcontainers",
    "automation",
    "devops",
    "software-testing",
    "integration-testing",
    "contract-testing",
  ]
image:
  src: "./microservices-testing-patterns.jpg"
  alt: "Microservices Testing Patterns Architecture Diagram"
category: "Testing"
draft: false
---

# Complete Guide to Testing Patterns in Microservices Architecture

Testing microservices presents unique challenges that traditional monolithic testing approaches cannot adequately address. With distributed systems, network calls, data consistency issues, and complex service interactions, a comprehensive testing strategy becomes crucial for maintaining system reliability and developer confidence.

This guide explores proven testing patterns, strategies, and tools specifically designed for microservices architectures, complete with practical examples and implementation details.

## Table of Contents

1. [The Microservices Testing Challenge](#the-microservices-testing-challenge)
2. [Testing Pyramid for Microservices](#testing-pyramid-for-microservices)
3. [Unit Testing Strategies](#unit-testing-strategies)
4. [Integration Testing Patterns](#integration-testing-patterns)
5. [Contract Testing with Pact](#contract-testing-with-pact)
6. [End-to-End Testing Approaches](#end-to-end-testing-approaches)
7. [Performance Testing Patterns](#performance-testing-patterns)
8. [Chaos Engineering for Resilience](#chaos-engineering-for-resilience)
9. [Test Automation Strategies](#test-automation-strategies)
10. [Best Practices and Anti-Patterns](#best-practices-and-anti-patterns)

## The Microservices Testing Challenge

Microservices architecture introduces several testing complexities:

- **Service Dependencies**: Services depend on multiple other services
- **Network Reliability**: Tests must account for network failures and latency
- **Data Consistency**: Eventual consistency across distributed data stores
- **Version Compatibility**: Services may be deployed independently with different versions
- **Environment Complexity**: Multiple services, databases, and infrastructure components

```javascript
// Example: Service dependency complexity
class OrderService {
  constructor(
    userService,
    inventoryService,
    paymentService,
    notificationService
  ) {
    this.userService = userService;
    this.inventoryService = inventoryService;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
  }

  async createOrder(orderData) {
    // Depends on 4 different services
    const user = await this.userService.getUser(orderData.userId);
    const inventory = await this.inventoryService.checkAvailability(
      orderData.items
    );
    const payment = await this.paymentService.processPayment(orderData.payment);
    await this.notificationService.sendConfirmation(user.email, orderData);

    return this.saveOrder(orderData);
  }
}
```

## Testing Pyramid for Microservices

The traditional testing pyramid needs adaptation for microservices. Here's the microservices-specific testing pyramid:

```mermaid
graph TD
    A["End-to-End Tests<br/>❌ Few, Expensive<br/>🎯 Critical User Journeys"] --> B["Contract Tests<br/>⚡ Fast, Reliable<br/>🎯 Service Interfaces"]
    B --> C["Integration Tests<br/>🔧 Component Level<br/>🎯 Service Boundaries"]
    C --> D["Unit Tests<br/>✅ Many, Fast, Cheap<br/>🎯 Business Logic"]

    style A fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#45b7d1,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#96ceb4,stroke:#333,stroke-width:2px,color:#fff

    classDef pyramid fill:#f9f9f9,stroke:#333,stroke-width:2px

    subgraph "Microservices Testing Pyramid"
        A
        B
        C
        D
    end
```

### Key Differences from Traditional Pyramid

1. **Contract Tests**: New layer ensuring service compatibility
2. **Reduced E2E Tests**: More focused on critical paths
3. **Enhanced Integration Tests**: Component-level testing with real dependencies
4. **Service-Scoped Unit Tests**: Focus on single service business logic

## Unit Testing Strategies

Unit tests form the foundation of your microservices testing strategy. They should test business logic in isolation, with external dependencies mocked.

### Pure Business Logic Testing

```javascript
// user-service/src/domain/User.js
class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.createdAt = userData.createdAt || new Date();
  }

  isEmailValid() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  canPlaceOrder() {
    const accountAge = Date.now() - this.createdAt.getTime();
    const minAccountAge = 24 * 60 * 60 * 1000; // 24 hours
    return this.isEmailValid() && accountAge >= minAccountAge;
  }

  getAgeInDays() {
    return Math.floor(
      (Date.now() - this.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );
  }
}

module.exports = User;
```

```javascript
// user-service/tests/unit/User.test.js
const User = require("../../src/domain/User");

describe("User Domain Logic", () => {
  describe("Email Validation", () => {
    test("should validate correct email format", () => {
      const user = new User({ id: 1, email: "test@example.com" });
      expect(user.isEmailValid()).toBe(true);
    });

    test("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid",
        "@example.com",
        "test@",
        "test.example.com",
      ];

      invalidEmails.forEach(email => {
        const user = new User({ id: 1, email });
        expect(user.isEmailValid()).toBe(false);
      });
    });
  });

  describe("Order Placement Eligibility", () => {
    test("should allow order for valid user with sufficient account age", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const user = new User({
        id: 1,
        email: "test@example.com",
        createdAt: twoDaysAgo,
      });

      expect(user.canPlaceOrder()).toBe(true);
    });

    test("should reject order for new account", () => {
      const user = new User({
        id: 1,
        email: "test@example.com",
        createdAt: new Date(),
      });

      expect(user.canPlaceOrder()).toBe(false);
    });

    test("should reject order for invalid email", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const user = new User({
        id: 1,
        email: "invalid-email",
        createdAt: twoDaysAgo,
      });

      expect(user.canPlaceOrder()).toBe(false);
    });
  });
});
```

### Service Layer Testing with Mocks

```javascript
// user-service/src/services/UserService.js
class UserService {
  constructor(userRepository, eventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  async createUser(userData) {
    // Validate user data
    if (!userData.email) {
      throw new Error("Email is required");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create new user
    const user = new User(userData);
    const savedUser = await this.userRepository.save(user);

    // Publish user created event
    await this.eventPublisher.publish("user.created", {
      userId: savedUser.id,
      email: savedUser.email,
      timestamp: new Date().toISOString(),
    });

    return savedUser;
  }

  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}

module.exports = UserService;
```

```javascript
// user-service/tests/unit/UserService.test.js
const UserService = require("../../src/services/UserService");
const User = require("../../src/domain/User");

// Mock dependencies
const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockEventPublisher = {
  publish: jest.fn(),
};

describe("UserService", () => {
  let userService;

  beforeEach(() => {
    userService = new UserService(mockUserRepository, mockEventPublisher);
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    test("should create user successfully", async () => {
      const userData = { email: "test@example.com", name: "Test User" };
      const expectedUser = new User({ ...userData, id: 1 });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(expectedUser);
      mockEventPublisher.publish.mockResolvedValue();

      const result = await userService.createUser(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        userData.email
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(mockEventPublisher.publish).toHaveBeenCalledWith("user.created", {
        userId: expectedUser.id,
        email: expectedUser.email,
        timestamp: expect.any(String),
      });
      expect(result).toEqual(expectedUser);
    });

    test("should throw error for missing email", async () => {
      const userData = { name: "Test User" }; // Missing email

      await expect(userService.createUser(userData)).rejects.toThrow(
        "Email is required"
      );
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    test("should throw error for existing user", async () => {
      const userData = { email: "test@example.com", name: "Test User" };
      const existingUser = new User({ ...userData, id: 1 });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(
        "User already exists"
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    test("should return user when found", async () => {
      const expectedUser = new User({ id: 1, email: "test@example.com" });
      mockUserRepository.findById.mockResolvedValue(expectedUser);

      const result = await userService.getUserById(1);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedUser);
    });

    test("should throw error when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(1)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
```

## Integration Testing Patterns

Integration tests verify that your service works correctly with its immediate dependencies. For microservices, this typically means testing with real databases, message queues, and external APIs.

```mermaid
graph TB
    subgraph "Integration Testing Architecture"
        A[Service Under Test] --> B[Test Database]
        A --> C[Test Message Queue]
        A --> D[Mock External Services]

        E[Test Container] --> B
        E --> C
        F[WireMock Server] --> D

        G[Test Suite] --> A
        G --> E
        G --> F
    end

    style A fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#ffd93d,stroke:#333,stroke-width:2px
    style C fill:#ffd93d,stroke:#333,stroke-width:2px
    style D fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#6c5ce7,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#a29bfe,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#00b894,stroke:#333,stroke-width:2px,color:#fff
```

### Using TestContainers for Integration Tests

```javascript
// user-service/tests/integration/UserService.integration.test.js
const { GenericContainer, Wait } = require("testcontainers");
const { Client } = require("pg");
const UserService = require("../../src/services/UserService");
const PostgresUserRepository = require("../../src/repositories/PostgresUserRepository");
const EventPublisher = require("../../src/events/EventPublisher");

describe("UserService Integration Tests", () => {
  let postgresContainer;
  let redisContainer;
  let dbClient;
  let userService;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new GenericContainer("postgres:13")
      .withEnvironment({
        POSTGRES_DB: "testdb",
        POSTGRES_USER: "testuser",
        POSTGRES_PASSWORD: "testpass",
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        Wait.forLogMessage("database system is ready to accept connections")
      )
      .start();

    // Start Redis container for event publishing
    redisContainer = await new GenericContainer("redis:6-alpine")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start();

    // Setup database connection
    const dbConfig = {
      host: postgresContainer.getHost(),
      port: postgresContainer.getMappedPort(5432),
      database: "testdb",
      user: "testuser",
      password: "testpass",
    };

    dbClient = new Client(dbConfig);
    await dbClient.connect();

    // Create tables
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Setup service dependencies
    const userRepository = new PostgresUserRepository(dbClient);
    const eventPublisher = new EventPublisher({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });

    userService = new UserService(userRepository, eventPublisher);
  }, 30000);

  afterAll(async () => {
    if (dbClient) await dbClient.end();
    if (postgresContainer) await postgresContainer.stop();
    if (redisContainer) await redisContainer.stop();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbClient.query("DELETE FROM users");
  });

  describe("User Creation Flow", () => {
    test("should create user and publish event", async () => {
      const userData = {
        email: "integration@test.com",
        name: "Integration Test User",
      };

      const createdUser = await userService.createUser(userData);

      // Verify user was created in database
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);

      // Verify user exists in database
      const dbResult = await dbClient.query(
        "SELECT * FROM users WHERE id = $1",
        [createdUser.id]
      );
      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].email).toBe(userData.email);

      // Verify event was published (you'd need to implement event verification)
      // This could involve checking Redis streams or using a test event consumer
    });

    test("should handle database constraint violations", async () => {
      const userData = {
        email: "duplicate@test.com",
        name: "Test User",
      };

      // Create user first time
      await userService.createUser(userData);

      // Attempt to create duplicate should fail
      await expect(userService.createUser(userData)).rejects.toThrow(
        "User already exists"
      );
    });
  });

  describe("User Retrieval", () => {
    test("should retrieve existing user", async () => {
      // Create a user directly in database
      const insertResult = await dbClient.query(
        "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id",
        ["retrieve@test.com", "Retrieve Test User"]
      );
      const userId = insertResult.rows[0].id;

      const retrievedUser = await userService.getUserById(userId);

      expect(retrievedUser.id).toBe(userId);
      expect(retrievedUser.email).toBe("retrieve@test.com");
      expect(retrievedUser.name).toBe("Retrieve Test User");
    });

    test("should throw error for non-existent user", async () => {
      await expect(userService.getUserById(99999)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
```

### Testing with Message Queues

```javascript
// order-service/tests/integration/OrderEventHandler.integration.test.js
const { GenericContainer, Wait } = require("testcontainers");
const amqp = require("amqplib");
const OrderEventHandler = require("../../src/events/OrderEventHandler");
const OrderService = require("../../src/services/OrderService");

describe("Order Event Handler Integration", () => {
  let rabbitmqContainer;
  let connection;
  let channel;
  let orderEventHandler;

  beforeAll(async () => {
    // Start RabbitMQ container
    rabbitmqContainer = await new GenericContainer("rabbitmq:3-management")
      .withExposedPorts(5672, 15672)
      .withWaitStrategy(Wait.forLogMessage("Server startup complete"))
      .start();

    // Setup RabbitMQ connection
    const rabbitmqUrl = `amqp://guest:guest@${rabbitmqContainer.getHost()}:${rabbitmqContainer.getMappedPort(5672)}`;
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Setup queues
    await channel.assertQueue("user.events", { durable: true });
    await channel.assertQueue("inventory.events", { durable: true });

    // Setup event handler
    const mockOrderService = {
      handleUserCreated: jest.fn(),
      handleInventoryUpdated: jest.fn(),
    };

    orderEventHandler = new OrderEventHandler(channel, mockOrderService);
  }, 30000);

  afterAll(async () => {
    if (channel) await channel.close();
    if (connection) await connection.close();
    if (rabbitmqContainer) await rabbitmqContainer.stop();
  });

  test("should process user created event", async () => {
    const userCreatedEvent = {
      eventType: "user.created",
      userId: 123,
      email: "newuser@test.com",
      timestamp: new Date().toISOString(),
    };

    // Publish event to queue
    await channel.sendToQueue(
      "user.events",
      Buffer.from(JSON.stringify(userCreatedEvent))
    );

    // Start consuming events
    await orderEventHandler.startConsuming();

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify event was processed
    expect(
      orderEventHandler.orderService.handleUserCreated
    ).toHaveBeenCalledWith(userCreatedEvent);
  });
});
```

## Contract Testing with Pact

Contract testing ensures that services can communicate with each other correctly. Pact is the most popular tool for consumer-driven contract testing.

```mermaid
graph LR
    subgraph "Contract Testing Flow"
        A[Consumer Service] --> B[Generate Contract]
        B --> C[Pact Broker]
        C --> D[Provider Service]
        D --> E[Verify Contract]
        E --> F[Contract Verified ✓]

        G[Consumer Tests] --> A
        H[Provider Tests] --> D

        I[CI/CD Pipeline] --> C
        I --> F
    end

    style A fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#ffd93d,stroke:#333,stroke-width:2px
    style C fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#a29bfe,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#6c5ce7,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#00b894,stroke:#333,stroke-width:2px,color:#fff
```

### Consumer Contract Tests

```javascript
// order-service/tests/contract/user-service.consumer.test.js
const { Pact } = require("@pact-foundation/pact");
const { like, eachLike, term } = require("@pact-foundation/pact").Matchers;
const UserServiceClient = require("../../src/clients/UserServiceClient");

describe("Order Service -> User Service Contract", () => {
  const userServicePact = new Pact({
    consumer: "order-service",
    provider: "user-service",
    port: 1234,
    log: "./logs/pact.log",
    dir: "./pacts",
    logLevel: "INFO",
  });

  beforeAll(() => userServicePact.setup());
  afterAll(() => userServicePact.finalize());
  afterEach(() => userServicePact.verify());

  describe("Get User by ID", () => {
    test("should return user details when user exists", async () => {
      // Define expected interaction
      await userServicePact.addInteraction({
        state: "user with ID 123 exists",
        uponReceiving: "a request for user with ID 123",
        withRequest: {
          method: "GET",
          path: "/api/users/123",
          headers: {
            "Content-Type": "application/json",
            Authorization: term({
              matcher: "Bearer .*",
              generate: "Bearer valid-token",
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            id: like(123),
            email: like("user@example.com"),
            name: like("John Doe"),
            status: term({
              matcher: "^(active|inactive)$",
              generate: "active",
            }),
            createdAt: term({
              matcher: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
              generate: "2024-01-01T10:00:00.000Z",
            }),
          },
        },
      });

      // Execute the interaction
      const userClient = new UserServiceClient("http://localhost:1234");
      const user = await userClient.getUserById(123, "valid-token");

      // Verify the response
      expect(user.id).toBe(123);
      expect(user.email).toBe("user@example.com");
      expect(user.status).toMatch(/^(active|inactive)$/);
    });

    test("should return 404 when user does not exist", async () => {
      await userServicePact.addInteraction({
        state: "user with ID 999 does not exist",
        uponReceiving: "a request for user with ID 999",
        withRequest: {
          method: "GET",
          path: "/api/users/999",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            error: like("User not found"),
            code: like("USER_NOT_FOUND"),
          },
        },
      });

      const userClient = new UserServiceClient("http://localhost:1234");

      await expect(userClient.getUserById(999, "valid-token")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("Get Users List", () => {
    test("should return paginated users list", async () => {
      await userServicePact.addInteraction({
        state: "users exist in the system",
        uponReceiving: "a request for users list with pagination",
        withRequest: {
          method: "GET",
          path: "/api/users",
          query: {
            page: "1",
            limit: "10",
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            users: eachLike(
              {
                id: like(123),
                email: like("user@example.com"),
                name: like("John Doe"),
                status: like("active"),
              },
              { min: 1 }
            ),
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(25),
              totalPages: like(3),
            },
          },
        },
      });

      const userClient = new UserServiceClient("http://localhost:1234");
      const response = await userClient.getUsers(
        { page: 1, limit: 10 },
        "valid-token"
      );

      expect(response.users).toHaveLength(1);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
    });
  });
});
```

### Provider Contract Verification

```javascript
// user-service/tests/contract/user-service.provider.test.js
const { Verifier } = require("@pact-foundation/pact");
const path = require("path");
const { GenericContainer } = require("testcontainers");

describe("User Service Provider Contract Verification", () => {
  let server;
  let postgresContainer;

  beforeAll(async () => {
    // Start test database
    postgresContainer = await new GenericContainer("postgres:13")
      .withEnvironment({
        POSTGRES_DB: "testdb",
        POSTGRES_USER: "testuser",
        POSTGRES_PASSWORD: "testpass",
      })
      .withExposedPorts(5432)
      .start();

    // Start the provider service with test configuration
    const app = require("../../src/app");
    server = app.listen(3001);

    // Setup test data based on provider states
    await setupProviderStates();
  });

  afterAll(async () => {
    if (server) server.close();
    if (postgresContainer) await postgresContainer.stop();
  });

  test("should verify contract with order-service", () => {
    const opts = {
      provider: "user-service",
      providerBaseUrl: "http://localhost:3001",
      pactBrokerUrl: process.env.PACT_BROKER_URL || "http://localhost:9292",
      pactBrokerUsername: process.env.PACT_BROKER_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_PASSWORD,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT || "1.0.0",
      stateHandlers: {
        "user with ID 123 exists": async () => {
          // Setup: Create user with ID 123
          await createTestUser({
            id: 123,
            email: "user@example.com",
            name: "John Doe",
            status: "active",
          });
        },
        "user with ID 999 does not exist": async () => {
          // Setup: Ensure user 999 doesn't exist
          await deleteTestUserIfExists(999);
        },
        "users exist in the system": async () => {
          // Setup: Create multiple test users
          await createMultipleTestUsers(25);
        },
      },
      requestFilter: (req, res, next) => {
        // Add authentication headers for testing
        req.headers.authorization = "Bearer valid-token";
        next();
      },
    };

    return new Verifier(opts).verifyProvider();
  });

  async function setupProviderStates() {
    // Initialize database schema and test data
    const dbClient = new Client({
      host: postgresContainer.getHost(),
      port: postgresContainer.getMappedPort(5432),
      database: "testdb",
      user: "testuser",
      password: "testpass",
    });

    await dbClient.connect();

    // Create users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbClient.end();
  }

  async function createTestUser(userData) {
    // Implementation to create test user in database
  }

  async function deleteTestUserIfExists(userId) {
    // Implementation to delete test user from database
  }

  async function createMultipleTestUsers(count) {
    // Implementation to create multiple test users
  }
});
```

### Pact Broker Integration

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract:consumer
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
          PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}

      - name: Publish contracts to Pact Broker
        run: npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          GIT_COMMIT: ${{ github.sha }}

  provider-tests:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run provider contract verification
        run: npm run test:contract:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
          PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}
          GIT_COMMIT: ${{ github.sha }}

  can-i-deploy:
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-tests]
    steps:
      - name: Check if safe to deploy
        run: |
          npx @pact-foundation/pact-node can-i-deploy \
            --participant=order-service \
            --version=${{ github.sha }} \
            --participant=user-service \
            --version=${{ github.sha }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }}
```

## End-to-End Testing Approaches

E2E tests verify complete user journeys across multiple services. For microservices, this typically involves complex test environments and careful orchestration.

```mermaid
graph TB
    subgraph "E2E Testing Architecture"
        A[Test Orchestrator] --> B[API Gateway]
        B --> C[User Service]
        B --> D[Order Service]
        B --> E[Inventory Service]
        B --> F[Payment Service]

        C --> G[User DB]
        D --> H[Order DB]
        E --> I[Inventory DB]
        F --> J[Payment DB]

        K[Message Queue] --> C
        K --> D
        K --> E
        K --> F

        L[Test Data Manager] --> G
        L --> H
        L --> I
        L --> J

        M[Environment Manager] --> A
        M --> L
    end

    style A fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style K fill:#ffd93d,stroke:#333,stroke-width:2px
    style L fill:#a29bfe,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#6c5ce7,stroke:#333,stroke-width:2px,color:#fff
```

### E2E Test Framework Setup

```javascript
// e2e-tests/src/framework/E2ETestFramework.js
const {
  GenericContainer,
  DockerComposeEnvironment,
} = require("testcontainers");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

class E2ETestFramework {
  constructor() {
    this.services = new Map();
    this.containers = new Map();
    this.environment = null;
    this.baseUrl = "";
    this.testSession = uuidv4();
  }

  async setupEnvironment() {
    try {
      // Start the complete microservices environment using docker-compose
      this.environment = await new DockerComposeEnvironment(
        "./e2e-tests/docker",
        "docker-compose.e2e.yml"
      )
        .withWaitStrategy(
          "api-gateway",
          Wait.forHttp("/health", 8080).forStatusCode(200)
        )
        .withWaitStrategy(
          "user-service",
          Wait.forHttp("/health", 3001).forStatusCode(200)
        )
        .withWaitStrategy(
          "order-service",
          Wait.forHttp("/health", 3002).forStatusCode(200)
        )
        .withWaitStrategy(
          "inventory-service",
          Wait.forHttp("/health", 3003).forStatusCode(200)
        )
        .withWaitStrategy(
          "payment-service",
          Wait.forHttp("/health", 3004).forStatusCode(200)
        )
        .up();

      // Get service endpoints
      const apiGateway = this.environment.getContainer("api-gateway");
      this.baseUrl = `http://${apiGateway.getHost()}:${apiGateway.getMappedPort(8080)}`;

      // Initialize HTTP client
      this.httpClient = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          "X-Test-Session": this.testSession,
        },
      });

      // Wait for all services to be ready
      await this.waitForServicesReady();

      console.log(`E2E environment ready at ${this.baseUrl}`);
    } catch (error) {
      console.error("Failed to setup E2E environment:", error);
      throw error;
    }
  }

  async teardownEnvironment() {
    if (this.environment) {
      await this.environment.down();
    }
  }

  async waitForServicesReady() {
    const maxRetries = 30;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await Promise.all([
          this.httpClient.get("/health"),
          this.httpClient.get("/api/users/health"),
          this.httpClient.get("/api/orders/health"),
          this.httpClient.get("/api/inventory/health"),
          this.httpClient.get("/api/payments/health"),
        ]);
        return; // All services are ready
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Services not ready after ${maxRetries} retries`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Test data management
  async createTestUser(userData) {
    const response = await this.httpClient.post("/api/users", {
      ...userData,
      testSession: this.testSession,
    });
    return response.data;
  }

  async createTestProduct(productData) {
    const response = await this.httpClient.post("/api/inventory/products", {
      ...productData,
      testSession: this.testSession,
    });
    return response.data;
  }

  async cleanupTestData() {
    try {
      // Clean up test data for this session
      await this.httpClient.delete(`/api/test-data/${this.testSession}`);
    } catch (error) {
      console.warn("Failed to cleanup test data:", error.message);
    }
  }

  // Authentication helpers
  async authenticateUser(email, password) {
    const response = await this.httpClient.post("/api/auth/login", {
      email,
      password,
    });

    const { token } = response.data;
    this.httpClient.defaults.headers.common["Authorization"] =
      `Bearer ${token}`;
    return token;
  }

  // API helpers with error handling and retries
  async makeRequest(method, url, data = null, options = {}) {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const config = {
          method,
          url,
          ...options,
        };

        if (data) {
          config.data = data;
        }

        const response = await this.httpClient(config);
        return response;
      } catch (error) {
        if (i === maxRetries - 1 || error.response?.status < 500) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

module.exports = E2ETestFramework;
```

### Complete User Journey E2E Tests

```javascript
// e2e-tests/tests/user-journey.e2e.test.js
const E2ETestFramework = require("../src/framework/E2ETestFramework");

describe("Complete User Journey E2E Tests", () => {
  let testFramework;
  let testUser;
  let testProducts;

  beforeAll(async () => {
    testFramework = new E2ETestFramework();
    await testFramework.setupEnvironment();
  }, 120000); // 2 minutes timeout for environment setup

  afterAll(async () => {
    await testFramework.cleanupTestData();
    await testFramework.teardownEnvironment();
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    testUser = await testFramework.createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: "testPassword123",
      name: "Test User",
    });

    testProducts = await Promise.all([
      testFramework.createTestProduct({
        name: "Test Product 1",
        price: 29.99,
        stock: 10,
      }),
      testFramework.createTestProduct({
        name: "Test Product 2",
        price: 49.99,
        stock: 5,
      }),
    ]);
  });

  describe("Complete Purchase Flow", () => {
    test("should allow user to register, browse, and purchase products", async () => {
      // Step 1: User registration (already done in beforeEach)
      expect(testUser.id).toBeDefined();
      expect(testUser.email).toContain("@example.com");

      // Step 2: User login
      const token = await testFramework.authenticateUser(
        testUser.email,
        "testPassword123"
      );
      expect(token).toBeDefined();

      // Step 3: Browse products
      const productsResponse = await testFramework.makeRequest(
        "GET",
        "/api/inventory/products"
      );
      expect(productsResponse.status).toBe(200);
      expect(productsResponse.data.products).toHaveLength(2);

      // Step 4: Add products to cart
      const cartItems = [
        { productId: testProducts[0].id, quantity: 2 },
        { productId: testProducts[1].id, quantity: 1 },
      ];

      for (const item of cartItems) {
        const addToCartResponse = await testFramework.makeRequest(
          "POST",
          "/api/orders/cart/items",
          item
        );
        expect(addToCartResponse.status).toBe(201);
      }

      // Step 5: Get cart contents
      const cartResponse = await testFramework.makeRequest(
        "GET",
        "/api/orders/cart"
      );
      expect(cartResponse.status).toBe(200);
      expect(cartResponse.data.items).toHaveLength(2);

      const expectedTotal = 29.99 * 2 + 49.99 * 1;
      expect(cartResponse.data.total).toBeCloseTo(expectedTotal, 2);

      // Step 6: Checkout process
      const checkoutData = {
        shippingAddress: {
          street: "123 Test Street",
          city: "Test City",
          zipCode: "12345",
          country: "Test Country",
        },
        paymentMethod: {
          type: "credit_card",
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2025",
          cvv: "123",
        },
      };

      const checkoutResponse = await testFramework.makeRequest(
        "POST",
        "/api/orders/checkout",
        checkoutData
      );
      expect(checkoutResponse.status).toBe(201);

      const order = checkoutResponse.data;
      expect(order.id).toBeDefined();
      expect(order.status).toBe("confirmed");
      expect(order.total).toBeCloseTo(expectedTotal, 2);

      // Step 7: Verify inventory was updated
      const updatedProductsResponse = await testFramework.makeRequest(
        "GET",
        "/api/inventory/products"
      );
      const updatedProducts = updatedProductsResponse.data.products;

      const updatedProduct1 = updatedProducts.find(
        p => p.id === testProducts[0].id
      );
      const updatedProduct2 = updatedProducts.find(
        p => p.id === testProducts[1].id
      );

      expect(updatedProduct1.stock).toBe(8); // 10 - 2
      expect(updatedProduct2.stock).toBe(4); // 5 - 1

      // Step 8: Verify order history
      const orderHistoryResponse = await testFramework.makeRequest(
        "GET",
        "/api/orders/history"
      );
      expect(orderHistoryResponse.status).toBe(200);
      expect(orderHistoryResponse.data.orders).toHaveLength(1);
      expect(orderHistoryResponse.data.orders[0].id).toBe(order.id);

      // Step 9: Verify payment was processed
      const paymentHistoryResponse = await testFramework.makeRequest(
        "GET",
        "/api/payments/history"
      );
      expect(paymentHistoryResponse.status).toBe(200);
      expect(paymentHistoryResponse.data.payments).toHaveLength(1);
      expect(paymentHistoryResponse.data.payments[0].orderId).toBe(order.id);
      expect(paymentHistoryResponse.data.payments[0].status).toBe("completed");
    });

    test("should handle insufficient inventory gracefully", async () => {
      // Login
      await testFramework.authenticateUser(testUser.email, "testPassword123");

      // Try to add more items than available
      const cartItem = {
        productId: testProducts[1].id, // Has stock of 5
        quantity: 10, // Requesting more than available
      };

      const addToCartResponse = await testFramework.makeRequest(
        "POST",
        "/api/orders/cart/items",
        cartItem
      );

      expect(addToCartResponse.status).toBe(400);
      expect(addToCartResponse.data.error).toContain("insufficient inventory");
    });

    test("should handle payment failures", async () => {
      // Login and add items to cart
      await testFramework.authenticateUser(testUser.email, "testPassword123");

      await testFramework.makeRequest("POST", "/api/orders/cart/items", {
        productId: testProducts[0].id,
        quantity: 1,
      });

      // Attempt checkout with invalid card
      const checkoutData = {
        shippingAddress: {
          street: "123 Test Street",
          city: "Test City",
          zipCode: "12345",
          country: "Test Country",
        },
        paymentMethod: {
          type: "credit_card",
          cardNumber: "4000000000000002", // Declined card number
          expiryMonth: "12",
          expiryYear: "2025",
          cvv: "123",
        },
      };

      const checkoutResponse = await testFramework.makeRequest(
        "POST",
        "/api/orders/checkout",
        checkoutData
      );

      expect(checkoutResponse.status).toBe(402);
      expect(checkoutResponse.data.error).toContain("payment declined");

      // Verify inventory was not modified
      const productsResponse = await testFramework.makeRequest(
        "GET",
        "/api/inventory/products"
      );
      const product = productsResponse.data.products.find(
        p => p.id === testProducts[0].id
      );
      expect(product.stock).toBe(10); // Original stock unchanged
    });
  });

  describe("Concurrent User Scenarios", () => {
    test("should handle multiple users purchasing same product concurrently", async () => {
      // Create multiple users
      const users = await Promise.all([
        testFramework.createTestUser({
          email: `concurrent1-${Date.now()}@example.com`,
          password: "testPassword123",
          name: "Concurrent User 1",
        }),
        testFramework.createTestUser({
          email: `concurrent2-${Date.now()}@example.com`,
          password: "testPassword123",
          name: "Concurrent User 2",
        }),
        testFramework.createTestUser({
          email: `concurrent3-${Date.now()}@example.com`,
          password: "testPassword123",
          name: "Concurrent User 3",
        }),
      ]);

      // Create product with limited stock
      const limitedProduct = await testFramework.createTestProduct({
        name: "Limited Product",
        price: 99.99,
        stock: 2, // Only 2 items available
      });

      // Simulate concurrent purchases
      const purchasePromises = users.map(async (user, index) => {
        try {
          // Login
          const client = axios.create({
            baseURL: testFramework.baseUrl,
            timeout: 30000,
          });

          const loginResponse = await client.post("/api/auth/login", {
            email: user.email,
            password: "testPassword123",
          });

          client.defaults.headers.common["Authorization"] =
            `Bearer ${loginResponse.data.token}`;

          // Add to cart
          await client.post("/api/orders/cart/items", {
            productId: limitedProduct.id,
            quantity: 1,
          });

          // Checkout
          return await client.post("/api/orders/checkout", {
            shippingAddress: {
              street: `${index + 1} Test Street`,
              city: "Test City",
              zipCode: "12345",
              country: "Test Country",
            },
            paymentMethod: {
              type: "credit_card",
              cardNumber: "4111111111111111",
              expiryMonth: "12",
              expiryYear: "2025",
              cvv: "123",
            },
          });
        } catch (error) {
          return error.response;
        }
      });

      const results = await Promise.all(purchasePromises);

      // Verify that only 2 purchases succeeded
      const successfulPurchases = results.filter(
        result => result.status === 201
      );
      const failedPurchases = results.filter(result => result.status !== 201);

      expect(successfulPurchases).toHaveLength(2);
      expect(failedPurchases).toHaveLength(1);

      // Verify inventory is now 0
      const finalProductResponse = await testFramework.makeRequest(
        "GET",
        `/api/inventory/products/${limitedProduct.id}`
      );
      expect(finalProductResponse.data.stock).toBe(0);
    });
  });
});
```

## Performance Testing Patterns

Performance testing in microservices requires testing individual services as well as the entire system under various load conditions.

```mermaid
graph TB
    subgraph "Performance Testing Stages"
        A[Load Testing] --> B[Stress Testing]
        B --> C[Spike Testing]
        C --> D[Volume Testing]
        D --> E[Endurance Testing]

        F[Service Level Tests] --> A
        G[Integration Tests] --> A
        H[System Tests] --> A

        I[Metrics Collection] --> J[Analysis]
        J --> K[Optimization]
        K --> L[Re-test]
        L --> I

        M[Performance Baseline] --> A
        N[SLA Requirements] --> A
    end

    style A fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#ffd93d,stroke:#333,stroke-width:2px
    style C fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#a29bfe,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#6c5ce7,stroke:#333,stroke-width:2px,color:#fff
```

### Load Testing with Artillery

```javascript
// performance-tests/artillery/load-test.yml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up phase"
    - duration: 300
      arrivalRate: 50
      name: "Load test phase"
    - duration: 120
      arrivalRate: 100
      name: "High load phase"
  plugins:
    metrics-by-endpoint:
      useOnlyRequestNames: true
  processor: "./processors/auth-processor.js"

scenarios:
  - name: "User Registration and Purchase Flow"
    weight: 40
    flow:
      - post:
          url: "/api/users"
          json:
            email: "{{ $randomEmail() }}"
            password: "testPassword123"
            name: "{{ $randomName() }}"
          capture:
            - json: "$.id"
              as: "userId"
            - json: "$.email"
              as: "userEmail"

      - post:
          url: "/api/auth/login"
          json:
            email: "{{ userEmail }}"
            password: "testPassword123"
          capture:
            - json: "$.token"
              as: "authToken"

      - get:
          url: "/api/inventory/products"
          headers:
            Authorization: "Bearer {{ authToken }}"
          capture:
            - json: "$.products[0].id"
              as: "productId"

      - post:
          url: "/api/orders/cart/items"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            productId: "{{ productId }}"
            quantity: "{{ $randomInt(1, 3) }}"

      - post:
          url: "/api/orders/checkout"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            shippingAddress:
              street: "{{ $randomStreet() }}"
              city: "{{ $randomCity() }}"
              zipCode: "{{ $randomZipCode() }}"
              country: "USA"
            paymentMethod:
              type: "credit_card"
              cardNumber: "4111111111111111"
              expiryMonth: "12"
              expiryYear: "2025"
              cvv: "123"

  - name: "Browse Products"
    weight: 30
    flow:
      - get:
          url: "/api/inventory/products"

      - get:
          url: "/api/inventory/products/{{ $randomInt(1, 100) }}"

      - get:
          url: "/api/inventory/categories"

  - name: "User Profile Management"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "existing-user@test.com"
            password: "testPassword123"
          capture:
            - json: "$.token"
              as: "authToken"

      - get:
          url: "/api/users/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"

      - put:
          url: "/api/users/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "{{ $randomName() }}"
            preferences:
              notifications: "{{ $randomBoolean() }}"
              theme: "{{ $randomChoice(['light', 'dark']) }}"

  - name: "Order History"
    weight: 10
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "existing-user@test.com"
            password: "testPassword123"
          capture:
            - json: "$.token"
              as: "authToken"

      - get:
          url: "/api/orders/history"
          headers:
            Authorization: "Bearer {{ authToken }}"

      - get:
          url: "/api/payments/history"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

```javascript
// performance-tests/artillery/processors/auth-processor.js
const faker = require("faker");

module.exports = {
  // Custom functions for generating test data
  $randomEmail: function () {
    return faker.internet.email();
  },

  $randomName: function () {
    return faker.name.findName();
  },

  $randomStreet: function () {
    return faker.address.streetAddress();
  },

  $randomCity: function () {
    return faker.address.city();
  },

  $randomZipCode: function () {
    return faker.address.zipCode();
  },

  $randomInt: function (min, max) {
    return faker.datatype.number({ min, max });
  },

  $randomBoolean: function () {
    return faker.datatype.boolean();
  },

  $randomChoice: function (choices) {
    return faker.random.arrayElement(choices);
  },
};
```

### Performance Testing with K6

```javascript
// performance-tests/k6/stress-test.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const failureRate = new Rate("failed_requests");
const checkoutDuration = new Trend("checkout_duration");

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 300 }, // Ramp up to 300 users
    { duration: "5m", target: 300 }, // Stay at 300 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.1"], // Error rate must be below 10%
    checkout_duration: ["p(95)<2000"], // Checkout must complete within 2s for 95% of requests
  },
};

const BASE_URL = "http://localhost:8080";

export function setup() {
  // Create test data that will be used across all VUs
  const products = [];
  for (let i = 0; i < 10; i++) {
    const response = http.post(
      `${BASE_URL}/api/inventory/products`,
      JSON.stringify({
        name: `Load Test Product ${i}`,
        price: Math.random() * 100 + 10,
        stock: 1000,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 201) {
      products.push(response.json().id);
    }
  }

  return { productIds: products };
}

export default function (data) {
  const userEmail = `loadtest-${Math.random()}@example.com`;
  const password = "testPassword123";

  // 1. User Registration
  let response = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({
      email: userEmail,
      password: password,
      name: `Load Test User ${Math.random()}`,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const registrationSuccess = check(response, {
    "user registration successful": r => r.status === 201,
  });

  if (!registrationSuccess) {
    failureRate.add(1);
    return;
  }

  // 2. User Login
  response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: userEmail,
      password: password,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const loginSuccess = check(response, {
    "login successful": r => r.status === 200,
    "token received": r => r.json("token") !== null,
  });

  if (!loginSuccess) {
    failureRate.add(1);
    return;
  }

  const token = response.json("token");
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 3. Browse Products
  response = http.get(`${BASE_URL}/api/inventory/products`, {
    headers: authHeaders,
  });

  check(response, {
    "products loaded": r => r.status === 200,
    "products list not empty": r => r.json("products").length > 0,
  });

  // 4. Add Random Product to Cart
  const randomProductId =
    data.productIds[Math.floor(Math.random() * data.productIds.length)];
  response = http.post(
    `${BASE_URL}/api/orders/cart/items`,
    JSON.stringify({
      productId: randomProductId,
      quantity: Math.floor(Math.random() * 3) + 1,
    }),
    {
      headers: authHeaders,
    }
  );

  check(response, {
    "add to cart successful": r => r.status === 201,
  });

  // 5. Checkout (measure this specifically)
  const checkoutStart = Date.now();
  response = http.post(
    `${BASE_URL}/api/orders/checkout`,
    JSON.stringify({
      shippingAddress: {
        street: "123 Load Test Street",
        city: "Test City",
        zipCode: "12345",
        country: "USA",
      },
      paymentMethod: {
        type: "credit_card",
        cardNumber: "4111111111111111",
        expiryMonth: "12",
        expiryYear: "2025",
        cvv: "123",
      },
    }),
    {
      headers: authHeaders,
    }
  );

  const checkoutEnd = Date.now();
  checkoutDuration.add(checkoutEnd - checkoutStart);

  const checkoutSuccess = check(response, {
    "checkout successful": r => r.status === 201,
    "order id received": r => r.json("id") !== null,
  });

  if (!checkoutSuccess) {
    failureRate.add(1);
  }

  // Think time
  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  // Cleanup test data if needed
  console.log("Load test completed");
}
```

### Microservice-Specific Performance Tests

```javascript
// performance-tests/service-specific/user-service-performance.test.js
const autocannon = require("autocannon");
const { GenericContainer } = require("testcontainers");

describe("User Service Performance Tests", () => {
  let userServiceContainer;
  let dbContainer;
  let serviceUrl;

  beforeAll(async () => {
    // Start database
    dbContainer = await new GenericContainer("postgres:13")
      .withEnvironment({
        POSTGRES_DB: "testdb",
        POSTGRES_USER: "testuser",
        POSTGRES_PASSWORD: "testpass",
      })
      .withExposedPorts(5432)
      .start();

    // Start user service
    userServiceContainer = await new GenericContainer("user-service:latest")
      .withEnvironment({
        DATABASE_URL: `postgresql://testuser:testpass@${dbContainer.getHost()}:${dbContainer.getMappedPort(5432)}/testdb`,
        NODE_ENV: "test",
      })
      .withExposedPorts(3001)
      .start();

    serviceUrl = `http://${userServiceContainer.getHost()}:${userServiceContainer.getMappedPort(3001)}`;

    // Wait for service to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    if (userServiceContainer) await userServiceContainer.stop();
    if (dbContainer) await dbContainer.stop();
  });

  test("should handle user creation load", async () => {
    const result = await autocannon({
      url: `${serviceUrl}/api/users`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "perf-test@example.com",
        password: "testPassword123",
        name: "Performance Test User",
      }),
      connections: 50,
      duration: 30, // 30 seconds
      requests: [
        {
          method: "POST",
          path: "/api/users",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `perf-test-${Math.random()}@example.com`,
            password: "testPassword123",
            name: "Performance Test User",
          }),
        },
      ],
    });

    console.log("User Creation Performance Results:");
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Latency p99: ${result.latency.p99}ms`);
    console.log(`Latency p95: ${result.latency.p95}ms`);
    console.log(
      `Error rate: ${((result.errors / result.requests.total) * 100).toFixed(2)}%`
    );

    // Performance assertions
    expect(result.requests.average).toBeGreaterThan(100); // At least 100 req/sec
    expect(result.latency.p95).toBeLessThan(500); // 95th percentile under 500ms
    expect(result.errors / result.requests.total).toBeLessThan(0.01); // Error rate under 1%
  });

  test("should handle user retrieval load", async () => {
    // Pre-populate database with test users
    const userIds = [];
    for (let i = 0; i < 100; i++) {
      const response = await fetch(`${serviceUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `lookup-test-${i}@example.com`,
          password: "testPassword123",
          name: `Lookup Test User ${i}`,
        }),
      });
      const user = await response.json();
      userIds.push(user.id);
    }

    const result = await autocannon({
      url: serviceUrl,
      connections: 100,
      duration: 60,
      requests: userIds.map(id => ({
        method: "GET",
        path: `/api/users/${id}`,
      })),
    });

    console.log("User Retrieval Performance Results:");
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Latency p99: ${result.latency.p99}ms`);
    console.log(`Latency p95: ${result.latency.p95}ms`);

    // Performance assertions for read operations should be faster
    expect(result.requests.average).toBeGreaterThan(500); // At least 500 req/sec for reads
    expect(result.latency.p95).toBeLessThan(100); // 95th percentile under 100ms for reads
  });
});
```

## Chaos Engineering for Resilience

Chaos engineering tests system resilience by intentionally introducing failures and observing how the system responds.

```mermaid
graph TB
    subgraph "Chaos Engineering Experiment Flow"
        A[Define Steady State] --> B[Form Hypothesis]
        B --> C[Design Experiment]
        C --> D[Run Experiment]
        D --> E[Measure Impact]
        E --> F[Analyze Results]
        F --> G[Improve System]
        G --> A

        H[Chaos Toolkit] --> D
        I[Toxiproxy] --> D
        J[Pumba] --> D
        K[Litmus] --> D

        L[Monitoring] --> E
        M[Alerting] --> E
        N[Logging] --> E
    end

    style A fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#ffd93d,stroke:#333,stroke-width:2px
    style C fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#a29bfe,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#6c5ce7,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#00b894,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#fd79a8,stroke:#333,stroke-width:2px,color:#fff
```

### Chaos Engineering with Chaos Toolkit

```json
{
  "version": "1.0.0",
  "title": "Microservices Resilience Test",
  "description": "Test system resilience when services fail",
  "configuration": {
    "base_url": {
      "type": "env",
      "key": "BASE_URL",
      "default": "http://localhost:8080"
    }
  },
  "steady-state-hypothesis": {
    "title": "System should handle requests successfully",
    "probes": [
      {
        "name": "health-check-api-gateway",
        "type": "probe",
        "provider": {
          "type": "http",
          "url": "${base_url}/health",
          "method": "GET",
          "timeout": 5
        },
        "tolerance": {
          "type": "probe",
          "name": "health-check-must-succeed",
          "provider": {
            "type": "python",
            "module": "chaoslib.tolerances",
            "func": "expect_status",
            "arguments": {
              "expected": 200
            }
          }
        }
      },
      {
        "name": "order-creation-success-rate",
        "type": "probe",
        "provider": {
          "type": "python",
          "module": "chaos_experiments.probes",
          "func": "measure_order_success_rate",
          "arguments": {
            "base_url": "${base_url}",
            "duration": 30,
            "concurrent_users": 10
          }
        },
        "tolerance": {
          "type": "range",
          "range": [95, 100],
          "target": "success_rate"
        }
      }
    ]
  },
  "method": [
    {
      "type": "action",
      "name": "simulate-user-service-failure",
      "provider": {
        "type": "python",
        "module": "chaos_experiments.actions",
        "func": "kill_service_container",
        "arguments": {
          "service_name": "user-service",
          "duration": 60
        }
      },
      "pauses": {
        "after": 30
      }
    }
  ],
  "rollbacks": [
    {
      "type": "action",
      "name": "restore-user-service",
      "provider": {
        "type": "python",
        "module": "chaos_experiments.actions",
        "func": "restart_service_container",
        "arguments": {
          "service_name": "user-service"
        }
      }
    }
  ]
}
```

```python
# chaos-experiments/chaos_experiments/probes.py
import requests
import time
import threading
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any

def measure_order_success_rate(base_url: str, duration: int, concurrent_users: int) -> Dict[str, Any]:
    """
    Measure the success rate of order creation under load
    """
    results = []
    start_time = time.time()
    end_time = start_time + duration

    def create_order():
        try:
            # Create a user first
            user_response = requests.post(
                f"{base_url}/api/users",
                json={
                    "email": f"chaos-test-{time.time()}@example.com",
                    "password": "testPassword123",
                    "name": "Chaos Test User"
                },
                timeout=10
            )

            if user_response.status_code != 201:
                return False

            # Login
            login_response = requests.post(
                f"{base_url}/api/auth/login",
                json={
                    "email": user_response.json()["email"],
                    "password": "testPassword123"
                },
                timeout=10
            )

            if login_response.status_code != 200:
                return False

            token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Get available products
            products_response = requests.get(
                f"{base_url}/api/inventory/products",
                headers=headers,
                timeout=10
            )

            if products_response.status_code != 200 or not products_response.json()["products"]:
                return False

            product_id = products_response.json()["products"][0]["id"]

            # Add to cart
            cart_response = requests.post(
                f"{base_url}/api/orders/cart/items",
                json={"productId": product_id, "quantity": 1},
                headers=headers,
                timeout=10
            )

            if cart_response.status_code != 201:
                return False

            # Checkout
            checkout_response = requests.post(
                f"{base_url}/api/orders/checkout",
                json={
                    "shippingAddress": {
                        "street": "123 Chaos Street",
                        "city": "Test City",
                        "zipCode": "12345",
                        "country": "USA"
                    },
                    "paymentMethod": {
                        "type": "credit_card",
                        "cardNumber": "4111111111111111",
                        "expiryMonth": "12",
                        "expiryYear": "2025",
                        "cvv": "123"
                    }
                },
                headers=headers,
                timeout=15
            )

            return checkout_response.status_code == 201

        except Exception as e:
            print(f"Order creation failed with error: {e}")
            return False

    # Run concurrent order creation
    with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
        while time.time() < end_time:
            futures = []

            # Submit batch of requests
            for _ in range(concurrent_users):
                if time.time() >= end_time:
                    break
                futures.append(executor.submit(create_order))

            # Collect results
            for future in as_completed(futures):
                if time.time() >= end_time:
                    break
                results.append(future.result())

            # Brief pause between batches
            time.sleep(0.1)

    # Calculate metrics
    total_requests = len(results)
    successful_requests = sum(results)
    success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0

    return {
        "success_rate": success_rate,
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": total_requests - successful_requests
    }

def check_service_health(base_url: str, service_name: str) -> bool:
    """
    Check if a specific service is healthy
    """
    try:
        response = requests.get(f"{base_url}/api/{service_name}/health", timeout=5)
        return response.status_code == 200
    except Exception:
        return False
```

```python
# chaos-experiments/chaos_experiments/actions.py
import docker
import time
from typing import Dict, Any

client = docker.from_env()

def kill_service_container(service_name: str, duration: int = 60) -> Dict[str, Any]:
    """
    Kill a service container for a specified duration
    """
    try:
        # Find the container
        containers = client.containers.list(filters={"name": service_name})
        if not containers:
            return {"error": f"Container {service_name} not found"}

        container = containers[0]
        original_status = container.status

        # Kill the container
        container.kill()
        print(f"Killed container {service_name}")

        # Wait for the specified duration
        time.sleep(duration)

        # Restart the container
        container.restart()
        print(f"Restarted container {service_name}")

        # Wait for it to be ready
        time.sleep(10)

        return {
            "service_name": service_name,
            "action": "kill_and_restart",
            "duration": duration,
            "status": "completed"
        }

    except Exception as e:
        return {"error": f"Failed to kill container {service_name}: {str(e)}"}

def restart_service_container(service_name: str) -> Dict[str, Any]:
    """
    Restart a service container
    """
    try:
        containers = client.containers.list(all=True, filters={"name": service_name})
        if not containers:
            return {"error": f"Container {service_name} not found"}

        container = containers[0]
        container.restart()

        # Wait for service to be ready
        time.sleep(15)

        return {
            "service_name": service_name,
            "action": "restart",
            "status": "completed"
        }

    except Exception as e:
        return {"error": f"Failed to restart container {service_name}: {str(e)}"}

def introduce_network_latency(service_name: str, latency_ms: int, duration: int = 60):
    """
    Introduce network latency using Toxiproxy or tc (traffic control)
    """
    try:
        # This would typically use Toxiproxy or tc commands
        # For simplicity, we'll simulate with container network manipulation

        containers = client.containers.list(filters={"name": service_name})
        if not containers:
            return {"error": f"Container {service_name} not found"}

        container = containers[0]

        # Add network delay using tc (traffic control)
        exec_result = container.exec_run([
            "tc", "qdisc", "add", "dev", "eth0", "root", "netem", "delay", f"{latency_ms}ms"
        ])

        if exec_result.exit_code != 0:
            return {"error": f"Failed to add network latency: {exec_result.output}"}

        print(f"Added {latency_ms}ms latency to {service_name}")

        # Wait for the specified duration
        time.sleep(duration)

        # Remove network delay
        container.exec_run(["tc", "qdisc", "del", "dev", "eth0", "root"])
        print(f"Removed network latency from {service_name}")

        return {
            "service_name": service_name,
            "action": "network_latency",
            "latency_ms": latency_ms,
            "duration": duration,
            "status": "completed"
        }

    except Exception as e:
        return {"error": f"Failed to introduce network latency: {str(e)}"}

def simulate_database_connection_failure(service_name: str, duration: int = 30):
    """
    Simulate database connection failure by manipulating environment variables
    """
    try:
        containers = client.containers.list(filters={"name": service_name})
        if not containers:
            return {"error": f"Container {service_name} not found"}

        container = containers[0]

        # Get current environment
        container_info = client.api.inspect_container(container.id)
        original_env = container_info['Config']['Env']

        # Create new environment with invalid database URL
        new_env = []
        for env_var in original_env:
            if env_var.startswith('DATABASE_URL='):
                new_env.append('DATABASE_URL=postgresql://invalid:invalid@invalid:5432/invalid')
            else:
                new_env.append(env_var)

        # Restart container with invalid database URL
        container.stop()
        client.containers.run(
            container.image.tags[0],
            name=f"{service_name}_chaos",
            environment=new_env,
            detach=True,
            remove=True
        )

        print(f"Started {service_name} with invalid database connection")

        # Wait for the specified duration
        time.sleep(duration)

        # Stop the chaos container and restart the original
        chaos_containers = client.containers.list(filters={"name": f"{service_name}_chaos"})
        for chaos_container in chaos_containers:
            chaos_container.stop()

        container.restart()
        time.sleep(15)  # Wait for service to be ready

        print(f"Restored {service_name} with valid database connection")

        return {
            "service_name": service_name,
            "action": "database_connection_failure",
            "duration": duration,
            "status": "completed"
        }

    except Exception as e:
        return {"error": f"Failed to simulate database failure: {str(e)}"}
```

### Network Chaos with Toxiproxy

```javascript
// chaos-experiments/network-chaos.test.js
const toxiproxy = require("toxiproxy-node-client");
const axios = require("axios");

describe("Network Chaos Experiments", () => {
  let toxiproxyClient;
  let proxy;

  beforeAll(async () => {
    toxiproxyClient = new toxiproxy.Toxiproxy("http://localhost:8474");

    // Create proxy for user service
    proxy = await toxiproxyClient.createProxy({
      name: "user-service-proxy",
      listen: "0.0.0.0:3011",
      upstream: "user-service:3001",
    });
  });

  afterAll(async () => {
    if (proxy) {
      await proxy.destroy();
    }
  });

  beforeEach(async () => {
    // Clear any existing toxics
    await proxy.destroyAllToxics();
  });

  test("should handle network latency gracefully", async () => {
    // Add latency toxic
    await proxy.addToxic({
      type: "latency",
      name: "high-latency",
      attributes: {
        latency: 2000, // 2 second delay
        jitter: 500, // ±500ms jitter
      },
    });

    const startTime = Date.now();

    try {
      const response = await axios.get("http://localhost:3011/api/users/1", {
        timeout: 5000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify the request succeeded despite latency
      expect(response.status).toBe(200);
      expect(duration).toBeGreaterThan(2000); // Should take at least 2 seconds
    } catch (error) {
      // If timeout, verify it's due to latency, not service failure
      expect(error.code).toBe("ECONNABORTED");
    }
  });

  test("should handle intermittent connection drops", async () => {
    // Add timeout toxic that drops 50% of connections
    await proxy.addToxic({
      type: "timeout",
      name: "connection-drops",
      attributes: {
        timeout: 0, // Immediate timeout
      },
      toxicity: 0.5, // Affect 50% of requests
    });

    const results = [];
    const totalRequests = 20;

    // Make multiple requests
    for (let i = 0; i < totalRequests; i++) {
      try {
        const response = await axios.get("http://localhost:3011/health", {
          timeout: 1000,
        });
        results.push({ success: true, status: response.status });
      } catch (error) {
        results.push({ success: false, error: error.code });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Verify that some requests succeeded and some failed
    expect(successCount).toBeGreaterThan(0);
    expect(failureCount).toBeGreaterThan(0);
    expect(successCount + failureCount).toBe(totalRequests);

    // Failure rate should be approximately 50%
    const failureRate = failureCount / totalRequests;
    expect(failureRate).toBeGreaterThan(0.3);
    expect(failureRate).toBeLessThan(0.7);
  });

  test("should handle bandwidth limitations", async () => {
    // Add bandwidth limit toxic
    await proxy.addToxic({
      type: "bandwidth",
      name: "slow-connection",
      attributes: {
        rate: 1024, // 1KB/s
      },
    });

    const startTime = Date.now();

    try {
      // Request a larger response that would be affected by bandwidth limits
      const response = await axios.get("http://localhost:3011/api/users", {
        timeout: 10000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      // Should take longer due to bandwidth restriction
      expect(duration).toBeGreaterThan(1000);
    } catch (error) {
      // Might timeout due to slow bandwidth
      expect(error.code).toBe("ECONNABORTED");
    }
  });

  test("should handle slow database responses", async () => {
    // Add slow_close toxic to simulate slow database
    await proxy.addToxic({
      type: "slow_close",
      name: "slow-db-close",
      attributes: {
        delay: 3000, // 3 second delay on connection close
      },
    });

    const results = [];
    const concurrentRequests = 5;

    // Make concurrent requests
    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      axios
        .get(`http://localhost:3011/api/users/${i + 1}`, {
          timeout: 8000,
        })
        .then(
          response => ({ success: true, status: response.status }),
          error => ({ success: false, error: error.code })
        )
    );

    const responses = await Promise.all(promises);

    // Some requests should succeed, but might be slower
    const successCount = responses.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(0);
  });
});
```

## Test Automation Strategies

Comprehensive test automation is crucial for maintaining quality in a microservices environment with frequent deployments.

### CI/CD Pipeline with GitHub Actions

```yaml
# .github/workflows/microservices-testing.yml
name: Microservices Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          [user-service, order-service, inventory-service, payment-service]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: "${{ matrix.service }}/package-lock.json"

      - name: Install dependencies
        run: npm ci
        working-directory: ${{ matrix.service }}

      - name: Run unit tests
        run: npm run test:unit -- --coverage
        working-directory: ${{ matrix.service }}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ${{ matrix.service }}/coverage/lcov.info
          flags: ${{ matrix.service }}

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    strategy:
      matrix:
        service:
          [user-service, order-service, inventory-service, payment-service]

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_USER: testuser
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:6-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: "${{ matrix.service }}/package-lock.json"

      - name: Install dependencies
        run: npm ci
        working-directory: ${{ matrix.service }}

      - name: Run database migrations
        run: npm run migrate
        working-directory: ${{ matrix.service }}
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        working-directory: ${{ matrix.service }}
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

  contract-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract:consumer
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
          PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}

      - name: Publish contracts
        run: npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
          PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}
          GIT_COMMIT: ${{ github.sha }}

  build-and-push:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    strategy:
      matrix:
        service:
          [user-service, order-service, inventory-service, payment-service]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  provider-contract-verification:
    runs-on: ubuntu-latest
    needs: build-and-push
    strategy:
      matrix:
        service:
          [user-service, order-service, inventory-service, payment-service]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Start service for contract verification
        run: |
          docker run -d --name ${{ matrix.service }}-test \
            -p 3001:3001 \
            -e NODE_ENV=test \
            -e DATABASE_URL=postgresql://testuser:testpass@host.docker.internal:5432/testdb \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:${{ github.sha }}

      - name: Wait for service to be ready
        run: |
          timeout 60s bash -c 'until curl -f http://localhost:3001/health; do sleep 2; done'

      - name: Run provider contract verification
        run: npm run test:contract:provider
        working-directory: ${{ matrix.service }}
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
          PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}
          GIT_COMMIT: ${{ github.sha }}

      - name: Cleanup
        run: docker stop ${{ matrix.service }}-test && docker rm ${{ matrix.service }}-test

  can-i-deploy:
    runs-on: ubuntu-latest
    needs: [contract-tests, provider-contract-verification]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Check if safe to deploy
        run: |
          npx @pact-foundation/pact-node can-i-deploy \
            --participant=user-service --version=${{ github.sha }} \
            --participant=order-service --version=${{ github.sha }} \
            --participant=inventory-service --version=${{ github.sha }} \
            --participant=payment-service --version=${{ github.sha }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-username=${{ secrets.PACT_BROKER_USERNAME }} \
            --broker-password=${{ secrets.PACT_BROKER_PASSWORD }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: can-i-deploy
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: "e2e-tests/package-lock.json"

      - name: Install dependencies
        run: npm ci
        working-directory: e2e-tests

      - name: Start microservices environment
        run: docker-compose -f docker-compose.e2e.yml up -d
        working-directory: e2e-tests

      - name: Wait for services to be ready
        run: |
          timeout 120s bash -c 'until curl -f http://localhost:8080/health; do sleep 5; done'

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: e2e-tests

      - name: Cleanup E2E environment
        if: always()
        run: docker-compose -f docker-compose.e2e.yml down -v
        working-directory: e2e-tests

  performance-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Start performance test environment
        run: docker-compose -f docker-compose.perf.yml up -d

      - name: Wait for services to be ready
        run: |
          timeout 120s bash -c 'until curl -f http://localhost:8080/health; do sleep 5; done'

      - name: Run performance tests
        run: |
          npm install -g artillery
          artillery run performance-tests/artillery/load-test.yml --output report.json

      - name: Generate performance report
        run: artillery report report.json --output performance-report.html

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.html

      - name: Cleanup performance environment
        if: always()
        run: docker-compose -f docker-compose.perf.yml down -v

  chaos-tests:
    runs-on: ubuntu-latest
    needs: performance-tests
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.9"

      - name: Install chaos engineering tools
        run: |
          pip install chaostoolkit chaostoolkit-lib
          pip install -r chaos-experiments/requirements.txt

      - name: Start chaos test environment
        run: docker-compose -f docker-compose.chaos.yml up -d

      - name: Wait for services to be ready
        run: |
          timeout 120s bash -c 'until curl -f http://localhost:8080/health; do sleep 5; done'

      - name: Run chaos experiments
        run: |
          cd chaos-experiments
          chaos run microservices-resilience.json

      - name: Cleanup chaos environment
        if: always()
        run: docker-compose -f docker-compose.chaos.yml down -v

  deploy:
    runs-on: ubuntu-latest
    needs: [can-i-deploy, e2e-tests, performance-tests, chaos-tests]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Add your deployment steps here

      - name: Run smoke tests in staging
        run: |
          echo "Running smoke tests in staging..."
          # Add smoke test steps here

      - name: Deploy to production
        if: success()
        run: |
          echo "Deploying to production environment..."
          # Add production deployment steps here
```

### Test Data Management

```javascript
// test-utils/TestDataManager.js
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");

class TestDataManager {
  constructor() {
    this.testSessions = new Map();
    this.cleanupQueue = [];
  }

  createTestSession(sessionId = null) {
    const id = sessionId || uuidv4();
    const session = {
      id,
      users: [],
      products: [],
      orders: [],
      createdAt: new Date(),
      cleanup: [],
    };

    this.testSessions.set(id, session);
    return session;
  }

  generateUser(overrides = {}) {
    const defaultUser = {
      email: faker.internet.email(),
      password: "testPassword123",
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      preferences: {
        notifications: faker.datatype.boolean(),
        theme: faker.helpers.arrayElement(["light", "dark"]),
        language: faker.helpers.arrayElement(["en", "es", "fr", "de"]),
      },
    };

    return { ...defaultUser, ...overrides };
  }

  generateProduct(overrides = {}) {
    const categories = [
      "Electronics",
      "Clothing",
      "Books",
      "Home & Garden",
      "Sports",
      "Beauty",
    ];

    const defaultProduct = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      category: faker.helpers.arrayElement(categories),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      stock: faker.number.int({ min: 0, max: 100 }),
      images: [
        faker.image.url({ width: 400, height: 400 }),
        faker.image.url({ width: 400, height: 400 }),
      ],
      specifications: {
        weight: `${faker.number.float({ min: 0.1, max: 10, precision: 0.1 })} kg`,
        dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 30 })} cm`,
        material: faker.commerce.productMaterial(),
      },
      isActive: true,
    };

    return { ...defaultProduct, ...overrides };
  }

  generateOrder(userId, productIds = [], overrides = {}) {
    const items =
      productIds.length > 0
        ? productIds.map(productId => ({
            productId,
            quantity: faker.number.int({ min: 1, max: 5 }),
            price: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
          }))
        : [
            {
              productId: faker.number.int({ min: 1, max: 100 }),
              quantity: faker.number.int({ min: 1, max: 3 }),
              price: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
            },
          ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    const defaultOrder = {
      userId,
      items,
      status: faker.helpers.arrayElement([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ]),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: "USA",
      },
      paymentMethod: {
        type: "credit_card",
        last4: faker.finance.creditCardNumber("####"),
        brand: faker.helpers.arrayElement([
          "Visa",
          "MasterCard",
          "American Express",
        ]),
      },
      pricing: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      },
      orderDate: faker.date.recent({ days: 30 }),
      estimatedDelivery: faker.date.future({ days: 7 }),
    };

    return { ...defaultOrder, ...overrides };
  }

  async createTestUser(httpClient, sessionId, userData = {}) {
    const session = this.testSessions.get(sessionId);
    if (!session) {
      throw new Error(`Test session ${sessionId} not found`);
    }

    const user = this.generateUser({
      ...userData,
      testSession: sessionId,
    });

    try {
      const response = await httpClient.post("/api/users", user);
      const createdUser = response.data;

      session.users.push(createdUser);
      session.cleanup.push({
        type: "user",
        id: createdUser.id,
        endpoint: `/api/users/${createdUser.id}`,
      });

      return createdUser;
    } catch (error) {
      console.error("Failed to create test user:", error.message);
      throw error;
    }
  }

  async createTestProduct(httpClient, sessionId, productData = {}) {
    const session = this.testSessions.get(sessionId);
    if (!session) {
      throw new Error(`Test session ${sessionId} not found`);
    }

    const product = this.generateProduct({
      ...productData,
      testSession: sessionId,
    });

    try {
      const response = await httpClient.post(
        "/api/inventory/products",
        product
      );
      const createdProduct = response.data;

      session.products.push(createdProduct);
      session.cleanup.push({
        type: "product",
        id: createdProduct.id,
        endpoint: `/api/inventory/products/${createdProduct.id}`,
      });

      return createdProduct;
    } catch (error) {
      console.error("Failed to create test product:", error.message);
      throw error;
    }
  }

  async createCompleteUserJourney(httpClient, sessionId) {
    const session = this.testSessions.get(sessionId);
    if (!session) {
      throw new Error(`Test session ${sessionId} not found`);
    }

    // Create user
    const user = await this.createTestUser(httpClient, sessionId);

    // Create products
    const products = await Promise.all([
      this.createTestProduct(httpClient, sessionId),
      this.createTestProduct(httpClient, sessionId),
      this.createTestProduct(httpClient, sessionId),
    ]);

    // Login user
    const loginResponse = await httpClient.post("/api/auth/login", {
      email: user.email,
      password: user.password,
    });

    const authToken = loginResponse.data.token;
    const authenticatedClient = {
      ...httpClient,
      defaults: {
        ...httpClient.defaults,
        headers: {
          ...httpClient.defaults.headers,
          Authorization: `Bearer ${authToken}`,
        },
      },
    };

    return {
      user,
      products,
      authToken,
      authenticatedClient,
    };
  }

  async cleanupTestSession(httpClient, sessionId) {
    const session = this.testSessions.get(sessionId);
    if (!session) {
      console.warn(`Test session ${sessionId} not found for cleanup`);
      return;
    }

    const cleanupPromises = session.cleanup.map(async item => {
      try {
        await httpClient.delete(item.endpoint);
        console.log(`Cleaned up ${item.type} with ID ${item.id}`);
      } catch (error) {
        console.warn(
          `Failed to cleanup ${item.type} ${item.id}:`,
          error.message
        );
      }
    });

    await Promise.allSettled(cleanupPromises);
    this.testSessions.delete(sessionId);

    console.log(`Cleaned up test session ${sessionId}`);
  }

  async cleanupAllSessions(httpClient) {
    const cleanupPromises = Array.from(this.testSessions.keys()).map(
      sessionId => this.cleanupTestSession(httpClient, sessionId)
    );

    await Promise.allSettled(cleanupPromises);
    console.log("All test sessions cleaned up");
  }

  // Bulk data generation for performance tests
  generateBulkUsers(count = 100) {
    return Array.from({ length: count }, () => this.generateUser());
  }

  generateBulkProducts(count = 100) {
    return Array.from({ length: count }, () => this.generateProduct());
  }

  generateBulkOrders(userIds, productIds, count = 100) {
    return Array.from({ length: count }, () => {
      const userId = faker.helpers.arrayElement(userIds);
      const orderProductIds = faker.helpers.arrayElements(productIds, {
        min: 1,
        max: 5,
      });
      return this.generateOrder(userId, orderProductIds);
    });
  }

  // Test data templates for specific scenarios
  getE2ETestScenarios() {
    return {
      happyPath: {
        user: this.generateUser({
          email: "happy-path@test.com",
          name: "Happy Path User",
        }),
        products: [
          this.generateProduct({ name: "Test Product 1", stock: 10 }),
          this.generateProduct({ name: "Test Product 2", stock: 5 }),
        ],
      },

      errorScenarios: {
        insufficientInventory: {
          user: this.generateUser({
            email: "inventory-test@test.com",
            name: "Inventory Test User",
          }),
          product: this.generateProduct({
            name: "Limited Stock Product",
            stock: 1,
          }),
        },

        paymentFailure: {
          user: this.generateUser({
            email: "payment-fail@test.com",
            name: "Payment Failure User",
          }),
          invalidCard: {
            type: "credit_card",
            cardNumber: "4000000000000002", // Declined card
            expiryMonth: "12",
            expiryYear: "2025",
            cvv: "123",
          },
        },
      },

      performanceTest: {
        users: this.generateBulkUsers(50),
        products: this.generateBulkProducts(20),
      },
    };
  }
}

module.exports = TestDataManager;
```

## Best Practices and Anti-Patterns

### ✅ Best Practices

1. **Test Pyramid Balance**

   - Focus on unit tests (70-80%)
   - Moderate integration tests (15-25%)
   - Minimal E2E tests (5-10%)
   - Strong contract test coverage

2. **Service Independence**

   - Each service should have its own test suite
   - Use test doubles for external dependencies
   - Test in isolation first, integration second

3. **Test Data Management**

   - Use factories for consistent test data
   - Implement proper cleanup mechanisms
   - Isolate test data between test runs

4. **CI/CD Integration**
   - Run tests in parallel where possible
   - Fail fast on critical test failures
   - Provide clear feedback on test results

### ❌ Anti-Patterns to Avoid

1. **Over-reliance on E2E Tests**

   ```javascript
   // ❌ Bad: Testing everything through the UI
   test("should process order", async () => {
     await page.goto("/login");
     await page.fill("#email", "test@example.com");
     await page.fill("#password", "password");
     await page.click("#login-button");
     // ... 50 more lines of UI interactions
   });

   // ✅ Good: Test business logic directly
   test("should process order", async () => {
     const order = await orderService.processOrder(validOrderData);
     expect(order.status).toBe("confirmed");
   });
   ```

2. **Shared Test Databases**

   ```javascript
   // ❌ Bad: Tests interfering with each other
   beforeAll(async () => {
     await database.seed(); // Shared data
   });

   // ✅ Good: Isolated test data
   beforeEach(async () => {
     testData = await testDataManager.createTestSession();
   });
   ```

3. **Testing Implementation Details**

   ```javascript
   // ❌ Bad: Testing internal implementation
   test("should call repository.save", async () => {
     await userService.createUser(userData);
     expect(mockRepository.save).toHaveBeenCalled();
   });

   // ✅ Good: Testing behavior
   test("should create user successfully", async () => {
     const user = await userService.createUser(userData);
     expect(user.id).toBeDefined();
     expect(user.email).toBe(userData.email);
   });
   ```

4. **Ignoring Contract Changes**

   ```javascript
   // ❌ Bad: No contract verification
   // Service A changes API without informing consumers

   // ✅ Good: Contract-first development
   // Use Pact to ensure backward compatibility
   ```

## Conclusion

Testing microservices requires a comprehensive strategy that addresses the unique challenges of distributed systems. By implementing the patterns and practices outlined in this guide, teams can build confidence in their microservices architecture while maintaining development velocity.

Key takeaways:

1. **Adapt the testing pyramid** for microservices with emphasis on contract tests
2. **Implement comprehensive test automation** to handle the complexity of multiple services
3. **Use appropriate tools** like TestContainers, Pact, and chaos engineering frameworks
4. **Focus on resilience testing** to ensure system reliability under failure conditions
5. **Maintain test data discipline** to avoid flaky tests and inter-test dependencies

Remember that testing in microservices is not just about code quality—it's about building systems that can evolve, scale, and remain reliable in production environments.

The investment in comprehensive testing strategies pays dividends in reduced production incidents, faster development cycles, and increased confidence in system changes. Start with the fundamentals and gradually incorporate more advanced patterns as your team and systems mature.
