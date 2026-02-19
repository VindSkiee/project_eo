# Event Organizer Backend API

> A comprehensive NestJS-based backend system for managing community events, finance, and administration with role-based access control (RBAC).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Setup](#project-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Modules & Endpoints](#modules--endpoints)
  - [Auth Module](#auth-module)
  - [Community Module](#community-module)
  - [Events Module](#events-module)
  - [Finance Module](#finance-module)
  - [Payment Module](#payment-module)
- [Common Functions & Utilities](#common-functions--utilities)
  - [Decorators](#decorators)
  - [Guards](#guards)
  - [Interceptors](#interceptors)
  - [Filters](#filters)
  - [DTOs](#dtos)
- [Database Schema](#database-schema)
- [Security & Authentication](#security--authentication)
- [API Response Format](#api-response-format)
- [Development Guidelines](#development-guidelines)

---

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Community Management**: Hierarchical group structure (RT/RW) with user management
- **Event Management**: Complete event lifecycle with approval workflow
- **Finance System**: Wallet management, transaction ledger, and dues collection
- **Payment Integration**: Midtrans payment gateway integration
- **Expense Tracking**: Event expense submission and verification
- **Fund Requests**: Cross-group funding request system
- **Transparency**: Public financial transparency for community members
- **Rate Limiting**: Built-in throttling to prevent abuse
- **Security**: Helmet, CORS, compression, cookie-based token storage

---

## 🛠 Tech Stack

- **Framework**: NestJS v11
- **Language**: TypeScript v5.9
- **Database**: PostgreSQL with Prisma ORM v5.10
- **Authentication**: Passport JWT
- **Payment Gateway**: Midtrans Client
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, bcrypt, express-rate-limit
- **API Documentation**: Swagger/OpenAPI

### Key Dependencies

```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/config": "^4.0.3",
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/swagger": "^11.2.6",
  "@nestjs/throttler": "^6.5.0",
  "@prisma/client": "^5.10.2",
  "bcrypt": "^6.0.0",
  "midtrans-client": "^1.4.3",
  "passport-jwt": "^4.0.1"
}
```

---

## 📦 Project Setup

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- PostgreSQL >= 14.x
- Midtrans Account (for payment features)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Environment Variables

Create a `.env` file in the backend root directory:

```env
# Application Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=api
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/event_organizer?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=event_organizer
DB_SSL=false

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_MERCHANT_ID=your-merchant-id
MIDTRANS_IS_PRODUCTION=false

# Optional: Mail Service
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mail-user
MAIL_PASSWORD=your-mail-password
MAIL_FROM=noreply@eventorganizer.com

# Optional: Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

### Database Setup

1. **Create PostgreSQL Database**
   ```bash
   createdb event_organizer
   ```

2. **Run Migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Seed Database (Optional)**
   ```bash
   npm run prisma:seed
   # or
   npx prisma db seed
   ```

### Running the Application

```bash
# Development mode (with watch)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding
│   └── migrations/           # Migration files
├── src/
│   ├── common/               # Shared utilities
│   │   ├── constants/        # Application constants
│   │   ├── decorators/       # Custom decorators
│   │   ├── dto/             # Common DTOs
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Authorization guards
│   │   ├── interceptors/    # Response interceptors
│   │   └── interfaces/      # Shared interfaces
│   ├── config/              # Configuration files
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── midtrans.config.ts
│   ├── database/            # Database module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── community/      # Users & Groups
│   │   ├── events/         # Event management
│   │   ├── finance/        # Finance & wallets
│   │   └── payment/        # Payment gateway
│   ├── providers/          # External services
│   │   ├── mail/          # Email service
│   │   └── storage/       # File storage
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry
├── test/                   # E2E tests
├── .env                   # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🔌 Modules & Endpoints

### Auth Module

**Description**: Handles user authentication, login, logout, and JWT token management.

**Base URL**: `/api/auth`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/login` | User login with email & password | ❌ | Public |
| `POST` | `/logout` | User logout (clears cookie) | ✅ | All authenticated |

**Request Bodies**:

**POST `/login`**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Key Features**:
- JWT token stored in HttpOnly cookie
- Password hashing with bcrypt
- Rate limiting (3 requests/minute for login)
- Automatic token refresh

---

### Community Module

**Description**: Manages users and community groups (RT/RW hierarchy).

#### Users Controller

**Base URL**: `/api/users`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/me` | Get my profile | ✅ | All authenticated |
| `GET` | `/` | Get all users (filtered by group) | ✅ | ADMIN, LEADER |
| `GET` | `/:id` | Get user by ID | ✅ | All authenticated |
| `POST` | `/` | Create new user | ✅ | ADMIN, LEADER |
| `PATCH` | `/:id` | Update user (admin) | ✅ | ADMIN, LEADER |
| `DELETE` | `/:id` | Soft delete user | ✅ | ADMIN, LEADER |
| `GET` | `/groups/:groupId` | Count users by group | ✅ | ADMIN, LEADER |
| `PATCH` | `/profile` | Update own profile | ✅ | All authenticated |
| `PATCH` | `/change-password` | Change own password | ✅ | All authenticated |

**Request Bodies**:

**POST `/`** - Create new user
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "password123",
  "phone": "081234567890",
  "address": "Jl. Contoh No. 123",
  "roleType": "RESIDENT",
  "communityGroupId": 1
}
```

**PATCH `/:id`** - Update user (admin)
```json
{
  "fullName": "John Doe Updated",
  "phone": "081234567890",
  "address": "New Address",
  "roleType": "ADMIN"
}
```
Note: All fields are optional

**PATCH `/profile`** - Update own profile
```json
{
  "fullName": "John Doe",
  "email": "newemail@example.com",
  "phone": "081234567890",
  "address": "New Address"
}
```
Note: All fields are optional

**PATCH `/change-password`** - Change password
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Key Features**:
- Hierarchical filtering (RT admins only see their RT members)
- Self-service profile management
- Soft delete support
- Audit trail (created by tracking)

#### Groups Controller

**Base URL**: `/api/groups`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/hierarchy` | Get organization hierarchy with officers | ✅ | All authenticated |
| `POST` | `/` | Create new group | ✅ | LEADER |
| `GET` | `/` | Get all groups | ✅ | All authenticated |
| `GET` | `/:id` | Get group by ID | ✅ | All authenticated |
| `PATCH` | `/:id` | Update group | ✅ | LEADER |
| `DELETE` | `/:id` | Delete group | ✅ | LEADER |

**Request Bodies**:

**POST `/`** - Create new group
```json
{
  "name": "RT 01",
  "type": "RT"
}
```
Note: Name format must be "RT XX" or "RW XX" (e.g., RT 01, RW 05)

**PATCH `/:id`** - Update group
```json
{
  "name": "RT 02",
  "type": "RT"
}
```
Note: All fields are optional

**Key Features**:
- RT/RW hierarchical structure
- Parent-child relationship management
- Pagination support

---

### Events Module

**Description**: Complete event lifecycle management with approval workflow.

#### Events Controller

**Base URL**: `/api/events`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/` | Create new event | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/` | Get all events (filtered) | ✅ | All authenticated |
| `GET` | `/:id` | Get event details | ✅ | All authenticated |
| `PATCH` | `/:id` | Update event | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/:id/submit` | Submit event for approval | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/:id/approve` | Process approval | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/:id/cancel` | Cancel event | ✅ | ADMIN, LEADER |
| `POST` | `/:id/expenses` | Submit expense | ✅ | TREASURER |
| `PATCH` | `/expenses/:expenseId/verify` | Verify expense | ✅ | ADMIN, LEADER |
| `POST` | `/:id/settle` | Settle event (close) | ✅ | ADMIN, LEADER |

**Request Bodies**:

**POST `/`** - Create new event
```json
{
  "data": {
    "title": "17 Agustusan 2026",
    "description": "Peringatan HUT RI ke-81",
    "budgetEstimated": 5000000,
    "startDate": "2026-08-17T08:00:00.000Z",
    "endDate": "2026-08-17T17:00:00.000Z"
  },
  "committeeUserIds": ["uuid-1", "uuid-2"]
}
```

**PATCH `/:id`** - Update event
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "budgetEstimated": 6000000,
  "startDate": "2026-08-17T08:00:00.000Z",
  "endDate": "2026-08-17T17:00:00.000Z"
}
```
Note: All fields are optional

**POST `/:id/approve`** - Process approval
```json
{
  "status": "APPROVED",
  "notes": "Approved with conditions"
}
```
Note: status can be "APPROVED" or "REJECTED". notes is optional but recommended for REJECTED

**POST `/:id/cancel`** - Cancel event
```json
{
  "reason": "Weather conditions not suitable"
}
```

**POST `/:id/expenses`** - Submit expense
```json
{
  "title": "Beli Konsumsi",
  "amount": 500000,
  "proofImage": "https://example.com/receipt.jpg"
}
```
Note: proofImage is optional

**PATCH `/expenses/:expenseId/verify`** - Verify expense
```json
{
  "isValid": true
}
```

**Event Status Flow**:
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → FUNDED → ONGOING → COMPLETED → SETTLED
                                 ↘ REJECTED
                                 ↘ CANCELLED
```

**Key Features**:
- Multi-step approval workflow
- Budget management (estimated vs actual)
- Expense tracking and verification
- Committee management
- Status history tracking
- Cross-group approval (RT → RW)

#### Fund Requests Controller

**Base URL**: `/api/fund-requests`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/` | Create fund request (RT → RW) | ✅ | ADMIN, TREASURER |
| `GET` | `/` | Get fund requests | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/:id/approve` | Approve fund request | ✅ | TREASURER, LEADER |
| `POST` | `/:id/reject` | Reject fund request | ✅ | TREASURER, LEADER |

**Request Bodies**:

**POST `/`** - Create fund request
```json
{
  "amount": 2000000,
  "description": "Dana tambahan untuk acara 17 Agustus",
  "eventId": "event-uuid-here"
}
```
Note: eventId is optional (can be for general operational funds)

**POST `/:id/reject`** - Reject fund request
```json
{
  "reason": "Budget RW tidak mencukupi",
  "rwDecision": "CANCEL_EVENT"
}
```
Note: rwDecision can be "CANCEL_EVENT" or "CONTINUE_WITH_ORIGINAL"

**Key Features**:
- RT can request additional funds from RW
- Automatic parent group detection
- Smart rejection (can force continue or cancel event)

---

### Finance Module

**Description**: Financial management including wallets, transactions, and dues collection.

**Base URL**: `/api/finance`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/wallet` | Get wallet details | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/transactions` | Get transaction history | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/transactions/:id` | Get transaction details | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/transactions` | Create manual transaction | ✅ | TREASURER, LEADER |
| `GET` | `/children-wallets` | Get all child wallets (RW view) | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/groups/:groupId/detail` | Get group finance detail | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/dues/config` | Set dues amount | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/dues/config` | Get dues configuration | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/dues/my-bill` | Get my monthly bill | ✅ | All authenticated |
| `GET` | `/transparency/balance` | Public balance view | ✅ | All authenticated |
| `GET` | `/transparency/history` | Public transaction history | ✅ | All authenticated |

**Request Bodies**:

**POST `/transactions`** - Create manual transaction
```json
{
  "type": "DEBIT",
  "amount": 100000,
  "description": "Pembelian ATK untuk kantor RT",
  "contributorUserId": "user-uuid-here"
}
```
Note: type can be "CREDIT" (income) or "DEBIT" (expense). contributorUserId is optional

**POST `/dues/config`** - Set dues amount
```json
{
  "amount": 15000,
  "dueDay": 10
}
```
Note: dueDay is the day of month (1-31) when dues are due

**Query Parameters**:

**GET `/transparency/history`** - Optional parameter
- `scope`: Filter by scope - "RT" (default) or "RW"

Example: `GET /transparency/history?scope=RW`

**Key Features**:
- Wallet per group (RT/RW)
- Double-entry ledger (DEBIT/CREDIT)
- Monthly dues calculation
- Automatic RT/RW dues splitting
- Financial transparency for residents
- Manual transaction support (cash transactions)

**Transaction Types**:
- `DEBIT`: Money out (expenses, transfers)
- `CREDIT`: Money in (contributions, event income)

---

### Payment Module

**Description**: Midtrans payment gateway integration for dues and event payments.

**Base URL**: `/api/payment`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/create` | Create payment transaction | ✅ | RESIDENT |
| `POST` | `/pay-dues` | Pay monthly dues | ✅ | All authenticated |
| `GET` | `/history` | Get payment history | ✅ | All authenticated |
| `GET` | `/status/:orderId` | Get transaction status | ✅ | All authenticated |
| `GET` | `/details/:paymentId` | Get payment details | ✅ | All authenticated |
| `POST` | `/cancel/:orderId` | Cancel transaction | ✅ | All authenticated |
| `POST` | `/refund` | Request refund | ✅ | RESIDENT |
| `GET` | `/all-transactions` | Get all transactions (admin) | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/refund/:refundId/process` | Process refund request | ✅ | ADMIN, TREASURER, LEADER |
| `POST` | `/notification` | Webhook from Midtrans | ❌ | Public (webhook) |

**Request Bodies**:

**POST `/create`** - Create payment transaction
```json
{
  "amount": 50000,
  "orderId": "EO-PAY-1234567890"
}
```
Note: orderId is optional, will be auto-generated if not provided

**POST `/pay-dues`** - Pay monthly dues
```json
{}
```
Note: No body required, amount is calculated automatically based on user's RT/RW dues configuration

**POST `/refund`** - Request refund
```json
{
  "paymentId": "payment-uuid-here",
  "amount": 30000,
  "reason": "Duplicate payment"
}
```

**Payment Methods Supported**:
- Virtual Account (BCA, BNI, BRI, Mandiri, Permata)
- E-Wallet (GoPay, ShopeePay, OVO, DANA)
- QRIS
- Credit Card
- Convenience Store (Alfamart, Indomaret)

**Payment Status**:
- `PENDING`: Awaiting payment
- `PAID`: Successfully paid
- `FAILED`: Payment failed
- `EXPIRED`: Payment link expired
- `REFUNDED`: Amount refunded
- `CANCELLED`: Transaction cancelled

**Key Features**:
- Automatic dues calculation
- Payment status tracking
- Refund management
- Webhook notification handling
- Transaction history per user
- Admin oversight

---

## 🔧 Common Functions & Utilities

### Decorators

Located in `src/common/decorators/`

#### `@Public()`

Marks a route as publicly accessible (bypasses JWT authentication).

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

#### `@Roles(...roles)`

Restricts route access to specific roles.

```typescript
@Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
@Post('groups')
async createGroup(@Body() dto: CreateGroupDto) {
  return this.groupsService.create(dto);
}
```

**Available Roles**:
- `RESIDENT`: Regular community member
- `ADMIN`: RT administrator
- `TREASURER`: RT/RW treasurer
- `LEADER`: RW leader
- `CUSTOM`: Custom role

#### `@ActiveUser()`

Injects the current authenticated user's data into the controller.

```typescript
@Get('profile')
async getProfile(@ActiveUser() user: ActiveUserData) {
  return this.usersService.findOne(user.id);
}
```

**ActiveUserData Interface**:
```typescript
interface ActiveUserData {
  sub: string;              // User ID
  email: string;
  roleType: SystemRoleType; // User's role
  communityGroupId: number; // User's group (RT/RW)
}
```

---

### Guards

Located in `src/common/guards/`

#### `JwtAuthGuard`

Global guard that validates JWT tokens from HttpOnly cookies. Configured in `app.module.ts`.

- Automatically applied to all routes
- Bypass using `@Public()` decorator
- Extracts token from `accessToken` cookie

#### `RolesGuard`

Validates user roles against route requirements.

- Works with `@Roles()` decorator
- Checks `user.role.type` from JWT payload
- Allows multiple roles (OR logic)

---

### Interceptors

Located in `src/common/interceptors/`

#### `TransformInterceptor`

Standardizes all API responses to a consistent format.

**Response Format**:
```typescript
{
  statusCode: number;
  message: string;
  data: T;
}
```

**Example**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

#### `TimeoutInterceptor`

Prevents long-running requests (can be configured per route).

---

### Filters

Located in `src/common/filters/`

#### `HttpExceptionFilter`

Catches and formats HTTP exceptions.

**Error Response Format**:
```typescript
{
  statusCode: number;
  timestamp: string;
  message: string;
  error: string;
}
```

**Example**:
```json
{
  "statusCode": 404,
  "timestamp": "2026-02-17T10:30:00.000Z",
  "message": "User not found",
  "error": "Not Found"
}
```

---

### DTOs

Located in `src/common/dto/`

#### `PaginationDto`

Standard pagination DTO for list endpoints.

```typescript
class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
}
```

**Usage**:
```typescript
@Get()
findAll(@Query() paginationDto: PaginationDto) {
  return this.service.findAll(paginationDto);
}
```

**Response**:
```typescript
interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### Constants

Located in `src/common/constants/messages.constant.ts`

Centralized message constants for consistency:

```typescript
export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
  },
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
  },
  // ... more messages
};
```

---

## 🗄 Database Schema

### Core Models

#### User
- **Fields**: id, email, password, fullName, phone, address, isActive
- **Relations**: Role, CommunityGroup, Events, Payments
- **Features**: Soft delete, audit trail

#### CommunityGroup
- **Fields**: id, name, type (RT/RW), parentId
- **Relations**: Users, Events, Wallet, DuesRule
- **Features**: Self-referential hierarchy

#### Role
- **Fields**: id, name, type (SystemRoleType), description
- **Relations**: Users, ApprovalRules
- **Types**: RESIDENT, ADMIN, TREASURER, LEADER, CUSTOM

### Finance Models

#### Wallet
- **Fields**: id, balance, communityGroupId
- **Relations**: CommunityGroup, Transactions
- **Features**: One wallet per group

#### Transaction
- **Fields**: id, walletId, amount, type, description, referenceCode
- **Types**: DEBIT, CREDIT
- **Relations**: Wallet, Event, Contribution, User

#### Contribution (Dues)
- **Fields**: id, userId, amount, month, year, paidAt
- **Relations**: User, Transaction, PaymentGatewayTx

#### DuesRule
- **Fields**: id, communityGroupId, amount, dueDay, isActive
- **Relations**: CommunityGroup

### Event Models

#### Event
- **Fields**: id, title, description, status, budgetEstimated, budgetActual, startDate, endDate
- **Status**: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED, FUNDED, ONGOING, COMPLETED, SETTLED
- **Relations**: CommunityGroup, User (creator), Approvals, Expenses, Participants

#### EventApproval
- **Fields**: id, eventId, approverId, roleSnapshot, stepOrder, status, notes
- **Status**: PENDING, APPROVED, REJECTED
- **Features**: Multi-step approval chain

#### EventExpense
- **Fields**: id, eventId, amount, description, verifiedAmount, isVerified
- **Relations**: Event, User (verifier)

#### ApprovalRule
- **Fields**: id, communityGroupId, roleId, stepOrder, isMandatory, minAmount, isCrossGroup
- **Features**: Dynamic approval workflow based on budget

### Payment Models

#### PaymentGatewayTx
- **Fields**: id, userId, orderId, amount, status, paymentType, snapToken, snapUrl
- **Status**: PENDING, PAID, FAILED, EXPIRED, REFUNDED, CANCELLED
- **Relations**: User, Contribution

#### FundRequest
- **Fields**: id, eventId, requesterGroupId, targetGroupId, amount, status, reason
- **Status**: PENDING, APPROVED, REJECTED
- **Features**: RT → RW fund requests

For complete schema, see `prisma/schema.prisma`

---

## 🔐 Security & Authentication

### Authentication Flow

1. **Login**: User submits email & password
2. **Verification**: Backend validates credentials
3. **Token Generation**: JWT token created with user data
4. **Cookie Storage**: Token stored in HttpOnly cookie
5. **Subsequent Requests**: Token automatically sent with each request
6. **Validation**: JwtAuthGuard validates token and extracts user data

### JWT Payload

```typescript
{
  sub: string;              // User ID
  email: string;
  role: {
    id: number;
    type: SystemRoleType;
  };
  communityGroupId: number;
}
```

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **HttpOnly Cookies**: Prevents XSS attacks
- **CORS Protection**: Configurable origins
- **Helmet**: Security headers
- **Rate Limiting**: Throttler for API endpoints
  - Short burst: 5 requests/second
  - Long term: 40 requests/minute
  - Login: 3 requests/minute
- **Compression**: Gzip compression enabled
- **Validation**: DTO validation with class-validator
- **SQL Injection Prevention**: Prisma parameterized queries

### Role-Based Access Control (RBAC)

**Hierarchy**:
```
LEADER (RW) > ADMIN (RT) > TREASURER > RESIDENT
```

**Permission Matrix**:

| Feature | RESIDENT | TREASURER | ADMIN | LEADER |
|---------|----------|-----------|-------|--------|
| View Events | ✅ | ✅ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ | ✅ |
| Approve Events (RT) | ❌ | ❌ | ✅ | ✅ |
| Approve Events (RW) | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ |
| Manage Groups | ❌ | ❌ | ❌ | ✅ |
| View Finances | Public | Full | Full | Full |
| Manage Wallet | ❌ | ✅ | Limited | ✅ |
| Pay Dues | ✅ | ✅ | ✅ | ✅ |

---

## 📡 API Response Format

### Success Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // ... response data
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "timestamp": "2026-02-17T10:30:00.000Z",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Paginated Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [...],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 💻 Development Guidelines

### Code Organization

- **Modular Architecture**: Each feature is a self-contained module
- **Separation of Concerns**: Controllers, Services, Repositories
- **Dependency Injection**: NestJS IoC container
- **Single Responsibility**: Each service has one clear purpose

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (prefix with `I` optional)

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### API Documentation

Swagger documentation available at: `http://localhost:3000/api/docs`

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Midtrans API Documentation](https://docs.midtrans.com)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 📝 License

UNLICENSED - Private Project

---

## 👥 Support

For issues and questions, please contact the development team.

---

**Last Updated**: February 17, 2026
