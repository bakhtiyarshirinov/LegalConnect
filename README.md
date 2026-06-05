# LegalConnect

A full-stack legal services platform for Azerbaijan connecting clients with verified lawyers. Built as a diploma project.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | .NET 9, ASP.NET Core, CQRS + MediatR, EF Core, PostgreSQL |
| Client Portal | React 18, TypeScript, Vite, TanStack Query, Framer Motion |
| Lawyer Portal | React 18, TypeScript, Vite, TanStack Query |
| Admin Portal | React 18, TypeScript, Vite, TanStack Query |
| Mobile | React Native (Expo), TypeScript, TanStack Query |
| Real-time | SignalR (chat) |
| Auth | JWT + BCrypt + OTP email verification |
| Video | Daily.co API |
| i18n | English, Azerbaijani, Russian (all 4 apps) |

## Project Structure

```
LegalConnect/
├── src/                  # .NET 9 backend (Clean Architecture)
│   ├── LegalConnect.API/          # Controllers, Program.cs
│   ├── LegalConnect.Application/  # CQRS handlers, DTOs
│   ├── LegalConnect.Domain/       # Entities, interfaces
│   ├── LegalConnect.Infrastructure/ # EF Core, repositories
│   └── LegalConnect.SignalR/      # Chat hub
├── client/               # React client portal (port 5173)
├── lawyer/               # React lawyer portal (port 5174)
├── admin/                # React admin portal (port 5175)
└── mobile/               # React Native Expo app
```

## How to Run

### Prerequisites
- Docker (PostgreSQL container)
- .NET 9 SDK
- Node.js 20+
- Expo Go app on phone (for mobile)

### 1. Database

```bash
# Start PostgreSQL
docker start legalconnect-db

# Reset to demo state (optional)
docker exec -i legalconnect-db psql -U postgres -d legalconnect < seed.sql
```

### 2. Backend

```bash
cd src/LegalConnect.API
dotnet run
# Runs on https://localhost:7777
```

### 3. Web Portals

```bash
# Client portal (port 5173)
cd client && npm run dev

# Lawyer portal (port 5174)
cd lawyer && npm run dev

# Admin portal (port 5175)
cd admin && npm run dev
```

### 4. Mobile App

```bash
cd mobile
npx expo start
# Scan QR code with Expo Go
```

## Test Credentials

> Password for ALL accounts: **Test!123**

| Role | Email | Notes |
|---|---|---|
| **Admin** | admin@legalconnect.az | Access admin portal |
| **Client** | anar@test.az | Has confirmed appt + chat with Kamran |
| **Client** | leyla@test.az | Has pending appointment with Nigar |
| **Client** | tural@test.az | Has completed appointment (can review) |
| **Lawyer** | kamran@test.az | Criminal & Civil Law, Baku, $150/hr |
| **Lawyer** | nigar@test.az | Family & Labor Law, Baku, $120/hr |
| **Lawyer** | rauf@test.az | Corporate & Tax Law, Ganja, $200/hr |
| **Lawyer** | sebine@test.az | Real Estate Law, Baku, $100/hr |
| **Lawyer** | elchin@test.az | Immigration & Civil Law, Sumqayit, $130/hr |
| **Lawyer (pending)** | farid@test.az | Tax & Corporate Law — NOT yet verified (for admin demo) |

## Features

### Client
- Register with OTP email verification
- Browse and search verified lawyers (filter by city, specialization, price, rating)
- View lawyer profiles with reviews and ratings
- Book appointments with slot picker (Online/Offline)
- View appointments with calendar view
- Real-time chat with lawyer (after confirmed appointment)
- Leave reviews for completed appointments
- Join video meetings (Daily.co)
- Notifications
- Multi-language (AZ/EN/RU)

### Lawyer
- Register and await admin verification
- Dashboard with stats (total/pending/completed/rating)
- Manage appointments (confirm, cancel, complete)
- Manage availability schedule (bulk slot creation by hour)
- Chat with clients
- Edit profile, bio, hourly rate, specializations
- Avatar upload
- Multi-language (AZ/EN/RU)

### Admin
- View and verify pending lawyer registrations
- View all users

## Demo Flows

**Flow 1 — Client books appointment:**
Login as `anar@test.az` → Browse Lawyers → Nigar Hüseynova → Book Appointment → Select date → Select slot → Confirm

**Flow 2 — Lawyer confirms appointment:**
Login as `nigar@test.az` on lawyer portal → Dashboard → Pending Requests → Confirm

**Flow 3 — Chat:**
Login as `anar@test.az` → already has chat with Kamran Əliyev

**Flow 4 — Leave review:**
Login as `tural@test.az` → Appointments → Completed appointment with Kamran → Leave Review

**Flow 5 — Admin verification:**
Login at admin portal as `admin@legalconnect.az` → Lawyers tab → Verify pending lawyer

## API

Base URL: `https://localhost:7777/api`

Swagger UI: `https://localhost:7777/swagger`

Key endpoints:
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/lawyers` — Browse lawyers (public)
- `GET /api/appointments/client/{clientId}` — Client appointments
- `GET /api/appointments/lawyer/{lawyerId}` — Lawyer appointments
- `GET /api/chats?userId={id}` — User chats
- `GET /api/slots/available?lawyerId={id}&date={date}` — Available slots
