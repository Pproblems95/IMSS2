# IMSS Medical Backend - Setup Guide

## Prerequisites

### PostgreSQL

Install PostgreSQL 14+ locally or use Docker.

**Option 1: Local installation**
- Download from https://www.postgresql.org/download/
- Default user: `postgres`, password: `postgres`, host: `localhost:5432`

**Option 2: Docker (recommended)**
```powershell
docker run --name imss-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=imss_medical -p 5432:5432 -d postgres:15
```

Verify connection:
```powershell
psql -h localhost -U postgres -d imss_medical -c "SELECT version();"
```

## Environment Variables

Create a `.env` file in the `backend` folder (or export):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=imss_medical
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

## Initial Setup

1. **Run migrations** (creates tables):
```powershell
npm run migrate
```

Expected output:
```
✓ Migration 001 (create_users_table) applied
✓ All migrations complete
```

2. **Run tests**:
```powershell
npm test
```

Expected: 7 tests pass (User model operations with database)

3. **Start development server**:
```powershell
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

- **Register**: `POST /api/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "secret",
    "curp": "ABC123XYZ"  // optional
  }
  ```

- **Login**: `POST /api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "secret"
  }
  ```
  Returns: `{ accessToken, refreshToken }`

- **Refresh**: `POST /api/auth/refresh`
  ```json
  {
    "refreshToken": "<token>"
  }
  ```
  Returns: new `{ accessToken, refreshToken }`

- **Logout**: `POST /api/auth/logout`
  - Option 1: Revoke specific refresh token
    ```json
    {
      "refreshToken": "<token>"
    }
    ```
  - Option 2: Revoke all tokens for authenticated user
    ```
    Authorization: Bearer <accessToken>
    ```

## Testing Locally

```powershell
# Register a user
$register = curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"secret"}'

# Login
$login = curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"secret"}'

# Extract tokens from response and use them
```

## Build for Production

```powershell
npm run build
npm start
```

Output compiled JavaScript is in `dist/`.

## Database Schema

Current tables:
- `users` - User accounts with email, password hash, CURP
- `schema_migrations` - Migration tracking

See `backend/src/db/migrate.ts` for migration definitions.
