# Church Ministry Management System

Multi-tenant, context-aware church ministry management platform.

## Architecture

```
mobile/ (React Native)  ─── REST ───→  backend/ (NestJS)  ─── ORM ───→  MySQL
```

### Multi-Tenancy
- Every table carries `church_id` column
- Resolved via `X-Church-ID` header (mobile) or subdomain (web)
- All repository methods enforce `church_id` filter via `TenantRepository` base class

### Context-Based Access
- Single user can have multiple roles simultaneously
- Active context (role + service) stored in JWT
- Context switching via `POST /auth/switch-context` issues new JWT
- No re-login required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript |
| ORM | Sequelize 6 + sequelize-typescript |
| Database | MySQL 8 |
| Auth | JWT (passport-jwt) |
| Validation | class-validator + class-transformer |
| Mobile | React Native (Expo) |
| State | Redux Toolkit |

## Project Structure

```
church-ministry-system/
├── backend/
│   ├── src/
│   │   ├── main.ts                    # Entry point
│   │   ├── app.module.ts              # Root module
│   │   ├── core/
│   │   │   ├── tenant/                # Tenant resolution middleware
│   │   │   ├── auth/                  # JWT auth, context switching
│   │   │   ├── context/               # Active context service
│   │   │   └── database/              # Sequelize config
│   │   ├── modules/
│   │   │   ├── users/                 # Users, members, roles
│   │   │   ├── church/                # Sectors, services, classes
│   │   │   ├── service-year/          # Years + promotion logic
│   │   │   ├── attendance/            # Sessions + records
│   │   │   ├── preparation/           # Lesson preparations + review
│   │   │   ├── tasks/                 # Spiritual tasks + assignments
│   │   │   ├── taio/                 # Points ledger + store
│   │   │   ├── events/                # Events + registrations + payments
│   │   │   ├── family/                # Families + relationships
│   │   │   ├── notifications/         # In-app notifications
│   │   │   └── reports/               # Aggregate queries
│   │   ├── shared/
│   │   │   ├── decorators/            # @Public, @Roles, @RequireContext
│   │   │   ├── guards/                # RolesGuard, TenantScopeGuard
│   │   │   ├── filters/               # HttpExceptionFilter
│   │   │   ├── interceptors/          # TransformInterceptor
│   │   │   └── pipes/                 # ValidationPipe
│   │   └── migrations/                # Sequelize migrations
│   ├── .env
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── store/                     # Redux Toolkit slices
│   │   ├── navigation/                # Role-based tab navigators
│   │   ├── screens/                   # Auth, servant, member, parent, leader
│   │   ├── api/                       # Axios client + API modules
│   │   ├── hooks/                     # useAuth, useActiveContext
│   │   └── utils/                     # Storage, offline queue
│   ├── App.tsx
│   └── package.json
└── README.md
```

## Setup

### Backend

```bash
cd backend
npm install

# Create MySQL database
mysql -u root -e "CREATE DATABASE church_ministry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Copy .env and configure
# Run migrations
npm run migration:run

# Seed roles
npm run seed

# Start dev server
npm run start:dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login with email/phone + password |
| GET | /auth/contexts | Get available contexts for user |
| POST | /auth/switch-context | Switch active context |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /members/me | Get current user profile |
| PATCH | /members/me | Update profile |
| GET | /members | List church members |
| POST | /members | Create new member |

### Church Structure
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sectors | List sectors |
| GET | /sectors/:id/services | Services in sector |
| GET | /services/:id/stage-groups | Stage groups in service |
| GET | /services/:id/classes | Classes in service |

### Service Years
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /service-years | List all years |
| GET | /service-years/current | Get current year |
| POST | /service-years/:id/promote | Run promotion logic |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /attendance/sessions | Create session |
| POST | /attendance/sessions/:id/records | Bulk record attendance |
| GET | /attendance/report | Attendance report |

### Taio (Points)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /taio/balance | Get my points balance |
| POST | /taio/award | Award points to member |
| GET | /taio/leaderboard | Points leaderboard |
| GET | /store/items | List store items |
| POST | /store/redeem | Redeem points for item |

### More endpoints in respective controllers

## Database Schema

22 tables fully normalized with:
- UUID primary keys
- `church_id` on every tenant-scoped table
- Soft deletes (`deleted_at`) on all major tables
- Composite unique indexes to prevent duplicates
- Performance indexes on common query patterns

## Key Design Decisions

1. **Transaction ledger for points** - Full audit trail, supports reversals and adjustments without data loss
2. **Context in JWT** - Reduces DB round-trips per request; context switch is an explicit user action
3. **Soft deletes everywhere** - Preserves historical data integrity for reports
4. **Denormalized church_id** - Single-column index filter for tenant isolation, avoids expensive joins
5. **No Redis in MVP** - Everything runs on MySQL; caching added later if needed
6. **Local file storage** - Files stored on server filesystem with URL-based schema; migration to S3 requires only changing URLs
