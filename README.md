# Stylework Lead Tracker — Backend API Service

[![NestJS](https://img.shields.io/badge/NestJS-12.x-E0234E.svg?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%2F6.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-FCC72B.svg?logo=vitest&logoColor=black)](https://vitest.dev/)

Enterprise-grade REST API backend for the **Stylework Lead Tracker** application, built with NestJS, TypeScript, and MongoDB.

---

## 1. Architecture & Design

The backend is engineered using a modular, decoupled domain architecture adhering to NestJS best practices and SOLID principles:

```text
backend/
├── src/
│   ├── leads/
│   │   ├── dto/
│   │   │   ├── create-lead.dto.ts        # Inbound payload schema & class-validator rules
│   │   │   ├── query-lead.dto.ts         # Query params for search, pagination, and sorting
│   │   │   └── update-lead-status.dto.ts # Status transition schema
│   │   ├── schemas/
│   │   │   └── lead.schema.ts            # Mongoose schema, LeadStatus enum, compound indexes
│   │   ├── leads.controller.ts           # HTTP routing & response status codes
│   │   ├── leads.service.ts              # Business logic, query builder, aggregation pipeline
│   │   ├── leads.module.ts               # Feature module definition
│   │   ├── leads.controller.spec.ts      # Controller unit tests
│   │   └── leads.service.spec.ts         # Service unit tests
│   ├── app.controller.ts                 # Health root endpoint
│   ├── app.module.ts                     # Root application module with Config & Mongoose setup
│   └── main.ts                           # Bootstrap file (ValidationPipe, CORS, prefix)
└── test/
    └── app.e2e-spec.ts                   # E2E test suite
```

### Key Architectural Decisions:
- **Global Validation Pipe**: `ValidationPipe` with `whitelist: true`, `transform: true`, and `forbidNonWhitelisted: true` ensures strict payload sanitation before reaching services.
- **Mongoose Compound Indexes**:
  - `{ status: 1, createdAt: -1 }` accelerates filtered pagination queries.
  - `{ createdAt: -1 }` optimizes default reverse chronological sorting.
- **Aggregation Pipeline**: The `/api/leads/stats` endpoint runs a single MongoDB aggregation query (`$group`) to compute pipeline totals and conversion rates with minimal database round-trips.
- **Regex Query Sanitization**: All user search queries are escaped against regex injection attacks before constructing Mongo search queries.

---

## 2. API Endpoints

All routes are prefixed with `/api`.

| Method | Endpoint | Description | Query / Body Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads` | Create a new lead | `{ name, email, phone, status? }` |
| `GET` | `/api/leads` | List leads (paginated) | `?q=...&status=...&page=1&limit=10&sortBy=createdAt&sortOrder=desc` |
| `GET` | `/api/leads/stats` | Pipeline metrics & counts | Aggregated breakdown by status and conversion % |
| `GET` | `/api/leads/:id` | Get single lead by ID | Path parameter: MongoDB ObjectId |
| `PATCH`| `/api/leads/:id/status` | Update lead stage | `{ status: "New" \| "Contacted" \| "Qualified" \| "Lost" \| "Closed" }` |

---

## 3. Setup & Installation

### Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`
- MongoDB local instance or MongoDB Atlas cluster connection string

### Step-by-Step Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ankitkumarupadhyay/lead-tracker-be.git
   cd lead-tracker-be
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/stylework_leads
   ```

4. **Run Development Server:**
   ```bash
   npm run start:dev
   ```
   The backend will be running at `http://localhost:3000/api`.

5. **Build for Production:**
   ```bash
   npm run build
   ```

6. **Start Production Server:**
   ```bash
   npm run start:prod
   ```

---

## 4. Running Automated Tests

Run the full unit test suite with Vitest:

```bash
npm run test
```

For test coverage report:
```bash
npm run test:cov
```

---

## 5. Deployment Guide

### Recommended Platforms: **Render** / **Railway** / **AWS ECS**

1. **Database Setup (MongoDB Atlas):**
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a database user and whitelist network access (`0.0.0.0/0` for cloud hosting).
   - Copy connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/stylework_leads?retryWrites=true&w=majority`.

2. **Deploy on Render / Railway:**
   - Create a new **Web Service** connected to `https://github.com/Ankitkumarupadhyay/lead-tracker-be.git`.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Set Environment Variables:
     - `PORT`: `3000` (or platform default)
     - `MONGODB_URI`: `<Atlas Connection String>`

---

## 6. Trade-offs & Engineering Decisions

1. **Regex Search vs. MongoDB Atlas Search ($text index):**
   - *Decision*: Implemented safe, escaped multi-field regex matching (`$or: [{ name: regex }, { email: regex }, { phone: regex }]`).
   - *Trade-off*: Regex search works consistently across local standalone MongoDB instances and test suites without requiring special Atlas search index configuration. For multi-million lead datasets, migrating to Atlas Search or Elasticsearch would provide sub-millisecond full-text indexing.

2. **In-memory Mocking vs. MongoMemoryServer for Unit Tests:**
   - *Decision*: Mocked Mongoose model query builders and aggregations in Vitest.
   - *Trade-off*: Tests execute in under 3 seconds with zero external binary downloads or platform-specific MongoDB daemon issues in CI/CD environments.

---

## 7. Future Improvements

- [ ] **Role-Based Access Control (RBAC)**: JWT authentication for sales reps vs. sales managers.
- [ ] **Lead Activity History & Audit Log**: Track timestamps and users who changed lead statuses.
- [ ] **Webhook & Email Integrations**: Trigger notifications via SendGrid/Slack upon lead qualification.
- [ ] **CSV / Excel Bulk Import & Export**: Fast ingestion of lead batches.
