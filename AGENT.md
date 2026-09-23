# AGENT.md — Backend AI Development Documentation

This document records the AI tools, prompts, engineering decisions, and code division throughout the development of the **Stylework Lead Tracker Backend**.

---

## 1. AI Tools & Environment

- **Primary AI Assistant**: Antigravity IDE (Advanced Agentic Pair Programmer)
- **Model Engine**: Gemini 3.8 Flash (Medium)
- **Runtime Environment**: Windows Powershell, Node.js v22.19.0, npm 10.9.3

---

## 2. Prompts Used & Interaction Chronology

### Prompt 1: Phase 0 Scaffolding
- **User Prompt**: Initialize full-stack monorepo with React+TS frontend and NestJS+TS backend without implementing features. Do not run git init or push yet.
- **AI Action**: Initialized clean NestJS project using `@nestjs/cli new backend --package-manager npm --skip-git`, set up `.gitignore` and `.env.example`, verified clean build and dev server startup, then safely stopped.

### Prompt 2: Phase 1 Git Initialization & Remote Configuration
- **User Prompt**: Connect `lead-tracker-be.git` for backend and `lead-tracker-fe.git` for frontend, commit, push, and proceed.
- **AI Action**: Initialized Git repository, verified ignore rules, executed initial commit, and pushed `main` branch to GitHub.

### Prompt 3: Modular Architecture & Full Feature Implementation
- **User Prompt**: "build in modular structure, modules => leads, leads.controller, leads.services etc, Do not push 3-4 files, build more features and then push"
- **AI Action**: Planned and executed the complete `LeadsModule`:
  - Defined Mongoose schema with `LeadStatus` enum and compound indices.
  - Implemented DTOs with `class-validator` and `class-transformer`.
  - Built comprehensive query builder supporting search, status filter, sorting, and pagination.
  - Added pipeline aggregation for conversion rate and status metrics.
  - Configured global pipes, CORS, and prefix in `main.ts`.
  - Built 18 unit tests across service and controller suites with Vitest.

---

## 3. Breakdown: AI-Generated vs. Manually Reviewed & Adapted

| Component | Nature | Description / Engineering Review |
| :--- | :--- | :--- |
| **`LeadsModule` & Architecture** | AI-Generated & Architected | Clean separation of concerns with Controller, Service, DTOs, and Schema. |
| **Schema Enum Type Fix** | AI Identified & Resolved | Fixed `@Prop({ type: String, enum: ... })` to prevent Mongoose schema reflection collision. |
| **Search Sanitization** | AI-Generated Best Practice | Implemented `escapeRegex()` helper to prevent regex injection (ReDoS). |
| **Aggregation Pipeline** | AI-Generated | Grouping query for conversion rate calculation directly in database layer. |
| **Mocking Strategy in Unit Tests** | AI Refactored | Replaced arrow functions with constructor function prototype mock for Mongoose `new Model()`. |
| **Global Middleware** | AI-Generated | CORS configuration and global API prefix `/api`. |

---

## 4. Key Engineering Decisions & Rationale

1. **DTO Validation with Transformation (`enableImplicitConversion`)**:
   - Query strings in HTTP requests arrive as strings (e.g. `?page=1&limit=10`). Enabling implicit conversion in `ValidationPipe` ensures numeric validation rules (`@IsInt()`, `@Min()`) parse query parameters correctly without manual parsing in controllers.

2. **Compound Indexing on `{ status: 1, createdAt: -1 }`**:
   - Status filtering combined with reverse-chronological sorting is the most frequent access pattern in lead tracking. Compound indexing avoids in-memory sort stages in MongoDB.

3. **Vitest over Jest in NestJS 12**:
   - NestJS 12 defaults to ESM with modern bundling. Vitest provides native ESM and TypeScript execution without complex Babel/ts-jest transform mapping.
