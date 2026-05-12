# Oil & Gas Management Backend API

## 🏗️ Clean Architecture với Repository Pattern

### ✨ Cải Tiến Chính

1. **ES Modules (ESM)** - Modern JavaScript standard
2. **Awilix** - Professional DI Container
3. **Repository Pattern** - Data access layer tách biệt
4. **Clean Architecture** - Separation of concerns
5. **Factory Pattern** - Flexible object creation

---

## 📁 Cấu Trúc Project

```
BE/
├── server.js                    # Entry point
├── package.json                 # type: "module" + awilix
├── src/
│   ├── app.js                   # Express app với DI
│   ├── container.js             # Awilix DI Container
│   │
│   ├── config/                  # ⚙️ Configuration
│   │   ├── db.js               # MongoDB connection
│   │   └── swagger.js          # API documentation
│   │
│   ├── models/                  # 📊 Data Models (Mongoose)
│   │   ├── user.js
│   │   └── loginLog.js
│   │
│   ├── repositories/            # 🗄️ Data Access Layer
│   │   ├── user.repository.js      # User CRUD operations
│   │   └── loginLog.repository.js  # Login log operations
│   │
│   ├── services/                # 💼 Business Logic Layer
│   │   ├── auth.service.js         # Auth business logic
│   │   ├── user.service.js         # User business logic
│   │   └── email.service.js        # Email operations
│   │
│   ├── controllers/             # 🎮 Request Handlers
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   │
│   ├── middlewares/             # 🔒 Middlewares
│   │   ├── auth.middleware.js      # JWT authentication
│   │   └── errorHandler.js         # Global error handler
│   │
│   ├── routes/                  # 🛣️ API Routes
│   │   ├── auth.route.js
│   │   └── user.route.js
│   │
│   └── utils/                   # 🛠️ Utilities
│       ├── constants.js
│       └── regex.js
```

---

## 🏛️ Architecture Flow

```
┌─────────────────────────────────────────────┐
│           HTTP Request                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  ROUTES                                     │
│  - Định nghĩa endpoints                     │
│  - Inject dependencies từ container         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  CONTROLLERS                                │
│  - Handle HTTP requests/responses           │
│  - Validate input                           │
│  - Call services                            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  SERVICES (Business Logic)                  │
│  - Authentication logic                     │
│  - Authorization                            │
│  - Data transformation                      │
│  - Orchestrate repositories                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  REPOSITORIES (Data Access)                 │
│  - CRUD operations                          │
│  - Query building                           │
│  - Data persistence                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  MODELS (Mongoose Schemas)                  │
│  - Data structure                           │
│  - Validation rules                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│           MongoDB Database                  │
└─────────────────────────────────────────────┘
```

---

## 🎯 Repository Pattern Benefits

### ❌ Before (Direct Model Access)

```javascript
// Service trực tiếp dùng Model
const user = await UserModel.findOne({ email });
await UserModel.create({ ... });
```

**Problems:**

- Business logic lẫn lộn với data access
- Khó test (phải mock Model)
- Duplicate queries ở nhiều nơi
- Khó thay đổi database

### ✅ After (Repository Pattern)

```javascript
// Service dùng Repository
const user = await userRepository.findByEmail(email);
await userRepository.create({ ... });
```

**Benefits:**

- ✅ Separation of concerns
- ✅ Reusable queries
- ✅ Easy to test (mock repository)
- ✅ Centralized data access
- ✅ Easy to switch databases

---

## 🔧 Setup và Chạy Project

### 1. Cài đặt Dependencies

```bash
cd BE
npm install
```

### 2. Cấu hình Environment

Tạo file `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=5h
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Chạy Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server: `http://localhost:5000`  
API Docs: `http://localhost:5000/api-docs`

---

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user (Admin only)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset with token

### Users

- `GET /api/users/me` - Current user profile
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users` - List users (Admin)
- `DELETE /api/users/:userId` - Delete user (Admin)

Xem chi tiết: `http://localhost:5000/api-docs`

---

## 💡 Code Examples

### Repository Usage

```javascript
// user.repository.js
export const createUserRepository = ({ UserModel }) => {
  const findByEmail = async (email) => {
    return await UserModel.findOne({ email });
  };

  const create = async (userData) => {
    return await UserModel.create(userData);
  };

  return { findByEmail, create };
};
```

### Service Using Repository

```javascript
// auth.service.js
export const createAuthService = ({ userRepository }) => {
  const login = async (email, password) => {
    // Dùng repository thay vì trực tiếp Model
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    // Business logic...
    return { token, user };
  };

  return { login };
};
```

### Container Registration (Awilix)

```javascript
// container.js
container.register({
  // Models
  UserModel: asValue(User),

  // Repositories (inject models)
  userRepository: asFunction(createUserRepository).singleton(),

  // Services (inject repositories)
  authService: asFunction(createAuthService).singleton(),

  // Controllers (inject services)
  authController: asFunction(createAuthController).transient(),
});
```

### Routes with Container

```javascript
// auth.route.js
export const createAuthRoutes = (container) => {
  const router = express.Router();
  const { authController, authMiddleware } = container.cradle;

  router.post("/login", authController.login);
  router.post("/logout", authMiddleware.authMiddleware, authController.logout);

  return router;
};
```

---

## 🧪 Testing

### Mock Repository for Testing

```javascript
// auth.service.test.js
import { createAuthService } from "../services/auth.service.js";

describe("Auth Service", () => {
  it("should login successfully", async () => {
    // Mock repository
    const mockUserRepo = {
      findByEmail: jest.fn().mockResolvedValue({
        _id: "123",
        email: "test@test.com",
        password: "hashed",
      }),
    };

    // Inject mock
    const authService = createAuthService({
      userRepository: mockUserRepo,
    });

    // Test
    const result = await authService.login("test@test.com", "password");

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("test@test.com");
    expect(result.token).toBeDefined();
  });
});
```

---

## 🎨 Design Patterns Used

### 1. **Repository Pattern**

- Centralized data access
- Abstraction over database operations

### 2. **Factory Pattern**

- Create services/controllers with dependencies
- Flexible object creation

### 3. **Dependency Injection**

- Loose coupling
- Easy testing
- Managed by Awilix

### 4. **Singleton Pattern**

- Single instance for services/repositories
- Managed by Awilix

---

## 📊 Architecture Comparison

| Layer          | Before           | After (Repository) |
| -------------- | ---------------- | ------------------ |
| **Controller** | → Service        | → Service (same)   |
| **Service**    | → Model directly | → Repository       |
| **Repository** | ❌ None          | ✅ → Model         |
| **Model**      | ← Direct access  | ← Via Repository   |

### Benefits:

- ✅ Better separation of concerns
- ✅ Easier to test
- ✅ Reusable queries
- ✅ Centralized data access
- ✅ Easier to maintain

---

## 🔒 Security Features

- JWT Authentication
- Password hashing (bcryptjs)
- Account locking after failed attempts
- Password reset with token expiration
- Soft delete with anonymization
- Role-based access control (RBAC)

---

## 📦 Dependencies

### Core

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `awilix` - Dependency injection
- `dotenv` - Environment config
- `cors` - CORS middleware
- `morgan` - HTTP logger

### Authentication

- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `nodemailer` - Email service

### Documentation

- `swagger-jsdoc` - Generate docs
- `swagger-ui-express` - Swagger UI

---

## 🚀 Best Practices Implemented

1. ✅ **Clean Architecture** - Layers tách biệt
2. ✅ **Repository Pattern** - Data access centralized
3. ✅ **Dependency Injection** - Loose coupling
4. ✅ **Factory Pattern** - Flexible creation
5. ✅ **ES Modules** - Modern JavaScript
6. ✅ **Error Handling** - Centralized middleware
7. ✅ **API Documentation** - Swagger/OpenAPI
8. ✅ **Logging** - Request & business logs
9. ✅ **Security** - JWT, RBAC, rate limiting
10. ✅ **Testing** - Mockable dependencies

---

## 📝 Notes

### Repository Methods Naming Convention:

- `findByX()` - Find single record
- `findAll()` - Find multiple with filters
- `create()` - Create new record
- `update()` - Update existing
- `softDelete()` - Soft delete
- `exists()` - Check existence
- `count()` - Count records

### Service Layer:

- Business logic only
- No direct database access
- Use repositories for data
- Handle authorization
- Transform data for response

### Controller Layer:

- HTTP request/response handling
- Input validation
- Call services
- Format response

---

**Version:** 3.0.0  
**Architecture:** ESM + Awilix + Repository Pattern  
**Date:** February 2026
