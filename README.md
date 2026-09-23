# Stylework Lead Tracker — Backend

Backend REST API service for the Stylework Lead Tracker, built with NestJS, TypeScript, and MongoDB.

## Tech Stack
- NestJS
- TypeScript
- Express
- MongoDB (Mongoose)

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Set `PORT` and `MONGODB_URI`.

3. Run development server:
   ```bash
   npm run start:dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Run production server:
   ```bash
   npm run start:prod
   ```
