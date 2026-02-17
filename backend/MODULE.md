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
| `POST` | `/` | Create new user | ✅ | ADMIN, LEADER |
| `GET` | `/` | Get all users (filtered by group) | ✅ | ADMIN, LEADER |
| `GET` | `/:id` | Get user by ID | ✅ | All authenticated |
| `PATCH` | `/:id` | Update user (admin) | ✅ | ADMIN, LEADER |
| `DELETE` | `/:id` | Soft delete user | ✅ | ADMIN, LEADER |
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
| `POST` | `/transactions` | Create manual transaction | ✅ | TREASURER, LEADER |
| `POST` | `/dues/config` | Set dues amount | ✅ | ADMIN, TREASURER, LEADER |
| `GET` | `/dues/my-bill` | Get my monthly bill | ✅ | RESIDENT (all users) |
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
| `POST` | `/refund/:refundId/process` | Process refund | ✅ | ADMIN, TREASURER, LEADER |
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
