# E-commerce REST API

A production-oriented REST API for an e-commerce backend, built with Node.js, Express 5, TypeScript and MongoDB (Mongoose). It ships with typed configuration, request validation, structured logging, centralized error handling, security middleware, a reusable query-feature layer (pagination, sorting, field selection, search and population), Docker support and a CI pipeline.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Running in Production](#running-in-production)
- [Project Structure](#project-structure)
- [API Conventions](#api-conventions)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Users](#users)
  - [Categories](#categories)
  - [Internal](#internal)
- [Testing and Quality](#testing-and-quality)
- [Continuous Integration](#continuous-integration)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 24 |
| Language | TypeScript 5 (ESM, `module: NodeNext`) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Validation | Zod 4 |
| Logging | Winston + Morgan |
| Security | Helmet, HPP, CORS |
| Testing | Jest + ts-jest |
| Quality | ESLint 9 (flat config), Prettier |
| Packaging | Multi-stage Dockerfile |

## Requirements

- Node.js `24.x` (pinned in `.nvmrc` as `v24.10.0`)
- npm 10+
- MongoDB 6+ (local instance or a `mongodb+srv://` connection string)

## Quick Start

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```dotenv
   NODE_ENV=development
   PORT=8000
   CORS_ORIGIN=http://localhost:3000
   LOG_LEVEL=debug
   MONGO_URI=mongodb://localhost:27017/eccomerce
   ```

3. Make sure MongoDB is running and reachable at `MONGO_URI`.

4. Start the development server (auto-reloads on change):

   ```bash
   npm run dev
   ```

5. Verify the API is up:

   ```bash
   curl http://localhost:8000/api/health
   ```

## Environment Variables

Configuration is parsed and validated at startup with Zod (`src/config/env.ts`). Invalid values stop the process immediately.

| Variable | Required | Default | Allowed values / notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | `development`, `production`, `test` |
| `PORT` | No | `3000` | Integer port. `.env` examples use `8000` |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Origin allowed by CORS (`credentials` enabled) |
| `LOG_LEVEL` | No | `info` | `error`, `warn`, `info`, `verbose`, `debug`, `silly` |
| `MONGO_URI` | No | `mongodb://localhost:27017/nodejs-eccomerce` | Must use the `mongodb://` or `mongodb+srv://` protocol |

> `.env` is ignored by Git. Never commit real credentials. Use the example above as a template and provide production values through your platform's secret manager.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`dist/src/server.js`) |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and apply safe fixes |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Verify formatting without writing |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:cov` | Run tests with coverage (output in `coverage/`) |

## Running in Production

Build and start:

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

The server performs a graceful shutdown on `SIGTERM`/`SIGINT`, gives in-flight requests up to 10 seconds to finish, and exits non-zero on unhandled rejections or uncaught exceptions.

### Docker

The included `Dockerfile` is a multi-stage build that compiles TypeScript in a builder stage and runs the output as a non-root user in the final image.

```bash
docker build -t ecommerce-api .
docker run --rm -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e MONGO_URI="mongodb://host.docker.internal:27017/eccomerce" \
  -e CORS_ORIGIN="https://app.example.com" \
  ecommerce-api
```

## Project Structure

```text
src/
  app.ts                  Express app assembly (middleware + routes)
  server.ts               Bootstrap, MongoDB connection, graceful shutdown
  config/
    env.ts                Zod-validated environment configuration
  middlewares/
    error-handler.ts      AppError class and centralized error middleware
    validate.ts           Zod request validation (body/query/params)
    logger.ts             Winston logger and Morgan request logging
  modules/
    healthcheck/          Health endpoint
    user/                 In-memory user module (controller/service/route/schema)
    category/             MongoDB category module (controller/model/route/schema)
  utils/
    api-features.ts       Reusable pagination/sort/select/search/populate builder
    response.ts           JSend-style response helpers
```

## API Conventions

- **Base URL:** `http://localhost:<PORT>/api` (the `.env` example uses port `8000`).
- **Content type:** JSON in and out. Send `Content-Type: application/json` for bodies.
- **Versioning:** Resource routes are versioned under `/api/v1/...`. The health check is unversioned.
- **Success responses** use a JSend-style envelope:

  ```json
  { "status": "success", "data": { } }
  ```

- **Errors** raised through `AppError` (including validation and 404) use:

  ```json
  { "statusCode": 400, "message": "..." }
  ```

  When `NODE_ENV=development`, a `stack` field is also included.
- **Unknown routes** return `404` with `{ "statusCode": 404, "message": "Route not found" }`.

## API Reference

### Health

#### `GET /api/health`

Returns liveness information. Unauthenticated.

**Response `200 OK`**

```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "uptime": 123.45
}
```

```bash
curl http://localhost:8000/api/health
```

---

### Users

> The user module is a demonstration module that stores data **in memory**. Records are lost on restart and are not shared between processes. It is not backed by MongoDB.

**User object**

```json
{
  "id": "6f1c2b9e-4f0a-4b3c-8f2d-1a2b3c4d5e6f",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

#### `GET /api/v1/users`

List all users.

**Response `200 OK`**

```json
{
  "status": "success",
  "data": [
    {
      "id": "6f1c2b9e-4f0a-4b3c-8f2d-1a2b3c4d5e6f",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

```bash
curl http://localhost:8000/api/v1/users
```

#### `GET /api/v1/users/:id`

Fetch a single user by UUID.

| Parameter | In | Type | Rules |
| --- | --- | --- | --- |
| `id` | path | string | Must be a valid UUID |

**Response `200 OK`** — the user object.

**Errors**

- `400` — invalid UUID.
- `404` — user not found.

```bash
curl http://localhost:8000/api/v1/users/6f1c2b9e-4f0a-4b3c-8f2d-1a2b3c4d5e6f
```

#### `POST /api/v1/users`

Create a user.

**Request body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | Required, 2–50 characters |
| `email` | string | Required, valid email |

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response `201 Created`** — the created user object.

**Errors**

- `400` — validation failed.
- `409` — a user with that email already exists.

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

#### `DELETE /api/v1/users/:id`

Delete a user by UUID.

**Response `204 No Content`**

**Errors**

- `400` — invalid UUID.
- `404` — user not found.

```bash
curl -X DELETE http://localhost:8000/api/v1/users/6f1c2b9e-4f0a-4b3c-8f2d-1a2b3c4d5e6f
```

---

### Categories

> Categories are persisted in MongoDB.

**Category object**

```json
{
  "_id": "6798a3f1c2b4e5d6f7a8b9c0",
  "name": "Electronics",
  "slug": "electronics",
  "image": "https://cdn.example.com/categories/electronics.png",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | 2–32 characters, unique |
| `slug` | string | Generated from `name`, lowercase |
| `image` | string | Optional URL |
| `createdAt` / `updatedAt` | date | Managed by Mongoose timestamps |

#### `GET /api/v1/categories`

List categories with pagination, sorting, field selection, search and population.

**Query parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | integer | `1` | Page number (must be positive) |
| `limit` | integer | `10` | Items per page (capped at `100`) |
| `sort` | string | `-createdAt` | Comma-separated fields. Prefix `-` for descending. Allowed: `name`, `slug`, `createdAt`, `updatedAt` |
| `select` | string | all allowed fields | Comma-separated fields to return. Prefix `-` to exclude. Allowed: `name`, `slug`, `image`, `createdAt`, `updatedAt`. Alias: `fields` |
| `search` | string | — | Case-insensitive search over `name` and `slug` |
| `populate` | string | — | Comma-separated reference paths to populate. Supported by the query layer; the category model currently defines no references |

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "results": 2,
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalResults": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "categories": [
      {
        "_id": "6798a3f1c2b4e5d6f7a8b9c0",
        "name": "Electronics",
        "slug": "electronics",
        "createdAt": "2026-01-01T12:00:00.000Z",
        "updatedAt": "2026-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

`results` is the number of items in the current page; `totalResults` is the total matching the filter.

```bash
# Page 2, 20 per page, newest first
curl "http://localhost:8000/api/v1/categories?page=2&limit=20&sort=-createdAt"

# Search and return only name and slug
curl "http://localhost:8000/api/v1/categories?search=phone&select=name,slug"

# Sort by name and exclude the image field
curl "http://localhost:8000/api/v1/categories?sort=name&select=-image"
```

#### `GET /api/v1/categories/:id`

Fetch a single category by MongoDB ObjectId.

| Parameter | In | Type | Rules |
| --- | --- | --- | --- |
| `id` | path | string | 24-character hexadecimal ObjectId and must exist |

**Response `200 OK`** — the category object.

**Errors**

- `400` — invalid id or no category with that id.

```bash
curl http://localhost:8000/api/v1/categories/6798a3f1c2b4e5d6f7a8b9c0
```

#### `POST /api/v1/categories`

Create a category. The `slug` is generated automatically from `name`. `name` must be unique.

**Request body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | Required, 2–30 characters, unique |

```json
{ "name": "Electronics" }
```

**Response `200 OK`** — the created category object.

**Errors**

- `400` — validation failed or the name already exists.

```bash
curl -X POST http://localhost:8000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics"}'
```

#### `PUT /api/v1/categories/:id`

Update a category's name. The slug is not regenerated.

**Request body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | Required, 2–30 characters, unique |

**Response `200 OK`** — the updated category object.

**Errors**

- `400` — invalid id, validation failed or the name is already used.

```bash
curl -X PUT http://localhost:8000/api/v1/categories/6798a3f1c2b4e5d6f7a8b9c0 \
  -H "Content-Type: application/json" \
  -d '{"name":"Consumer Electronics"}'
```

#### `DELETE /api/v1/categories/:id`

Delete a category by ObjectId.

**Response `204 No Content`**

**Errors**

- `400` — invalid id or no category with that id.

```bash
curl -X DELETE http://localhost:8000/api/v1/categories/6798a3f1c2b4e5d6f7a8b9c0
```

---

### Internal

#### `GET /env`

Returns the process environment variables. Intended for local debugging only.

> **Security warning:** this route exposes every environment variable, including secrets. It must not be reachable in production. Remove it or protect it behind authentication before deploying.

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "env": {
      "NODE_ENV": "development",
      "PORT": "8000"
    }
  }
}
```

---

## Testing and Quality

```bash
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Jest
npm run test:cov      # Jest with coverage
```

Tests use Jest in ESM mode via `ts-jest`. Existing coverage includes the user service and the shared API query-feature helpers (`src/utils/api-features.test.ts`).

## Continuous Integration

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests and manual dispatch. It uses the Node version from `.nvmrc`, then runs, in order:

1. `npm ci`
2. `npm run typecheck`
3. `npm run format:check`
4. `npm run lint`
5. `npm test`
6. `npm run build`
