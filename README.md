# LegalConnect — Hüquqi Xidmətlər Platforması

## Haqqında

Azərbaycanda vəkil axtarışı üçün platforma. Müştərilər təsdiqlənmiş vəkilləri axtarır, görüş rezerv edir, real vaxtlı çat və video görüş aparır. Diplom layihəsi.

## Texnologiyalar

**Backend:** .NET 9, Clean Architecture, CQRS, MediatR, EF Core 9, PostgreSQL, SignalR, JWT  
**Web:** React 19 + TypeScript, Vite, Framer Motion, Zustand, React Query  
**Mobile:** React Native + Expo SDK 56, TypeScript  
**Database:** PostgreSQL 16 (Docker)  
**Email:** Gmail SMTP (MailKit)  
**Video:** Daily.co API  
**i18n:** Azərbaycan, İngilis, Rus dilləri (bütün 4 proqramda)

## Layihənin Strukturu

```
LegalConnect/
├── src/                          # .NET 9 backend (Clean Architecture)
│   ├── LegalConnect.API/         # Controllers, Program.cs
│   ├── LegalConnect.Application/ # CQRS handlers, DTOs
│   ├── LegalConnect.Domain/      # Entities, interfaces
│   ├── LegalConnect.Infrastructure/ # EF Core, repositories
│   └── LegalConnect.SignalR/     # Chat hub
├── client/                       # React müştəri portalı (port 5173)
├── lawyer/                       # React vəkil portalı (port 5174)
├── admin/                        # React admin portalı (port 5175)
└── mobile/                       # React Native Expo tətbiqi
```

## Necə İşə Salmaq

### Tələblər
- Docker (PostgreSQL konteyner)
- .NET 9 SDK
- Node.js 20+
- Expo Go (mobil üçün)

### 1. Verilənlər bazası

```bash
docker start legalconnect-db

# Demo məlumatları yükləmək üçün (isteğe bağlı)
docker exec -i legalconnect-db psql -U postgres -d legalconnect < seed.sql
```

### 2. Backend

```bash
cd src/LegalConnect.API
dotnet run
# https://localhost:7777 ünvanında işləyir
```

### 3. Veb portallar

```bash
cd client && npm run dev   # port 5173
cd lawyer && npm run dev   # port 5174
cd admin && npm run dev    # port 5175
```

### 4. Mobil tətbiq

```bash
cd mobile
npx expo start
# Expo Go ilə QR kodu skan edin
```

## Test Etimadnamələri

> Bütün hesablar üçün şifrə: **Test!123**

| Rol | E-poçt | Qeyd |
|---|---|---|
| **Admin** | admin@legalconnect.az | Admin portalı |
| **Müştəri** | anar@test.az | Kamranla təsdiqlənmiş görüş + çat |
| **Müştəri** | leyla@test.az | Nigarla gözlənilən görüş |
| **Müştəri** | tural@test.az | Tamamlanmış görüş (rəy yaza bilər) |
| **Vəkil** | kamran@test.az | Cinayət & Mülki hüquq, Bakı, $150/saat |
| **Vəkil** | nigar@test.az | Ailə & Əmək hüququ, Bakı, $120/saat |
| **Vəkil** | rauf@test.az | Korporativ & Vergi hüququ, Gəncə, $200/saat |
| **Vəkil** | sebine@test.az | Daşınmaz əmlak hüququ, Bakı, $100/saat |
| **Vəkil** | elchin@test.az | Miqrasiya & Mülki hüquq, Sumqayıt, $130/saat |
| **Vəkil (gözləyir)** | farid@test.az | Hələ təsdiqlənməyib — admin demosu üçün |

## Xüsusiyyətlər

### Müştəri
- OTP e-poçt doğrulaması ilə qeydiyyat
- Təsdiqlənmiş vəkilləri axtarış (şəhər, ixtisas, qiymət, reytinq üzrə filtr)
- Vəkil profilləri — rəylər, reytinq diaqramı, onlayn status
- Slot seçərək görüş rezerv etmək (Onlayn/Oflayn)
- Görüşlər — filtr, görüşə qoşulmaq (video)
- Vəkillə real vaxtlı çat + fayl/şəkil göndərmək
- Tamamlanmış görüşlər üçün rəy yazmaq
- Bildirişlər
- Çoxdilli interfeys (AZ/EN/RU)

### Vəkil
- Qeydiyyat + admin tərəfindən təsdiqləmə gözləmək
- Statistika paneli (cəmi/gözləyir/tamamlandı/reytinq)
- Görüşlər — təsdiqləmə, ləğv, tamamlama
- İş cədvəli — saatlıq slot yaratmaq
- Müştərilərlə çat
- Profil redaktəsi — bio, qiymət, ixtisaslar, avatar
- Çoxdilli interfeys (AZ/EN/RU)

### Admin
- Gözlənilən vəkil qeydiyyatlarını görmək və təsdiqləmək
- Bütün istifadəçiləri görmək

## Demo Ssenariləri

**Ssenari 1 — Müştəri görüş rezerv edir:**  
`anar@test.az` → Vəkillər → Nigar Hüseynova → Görüş rezerv et → Tarix → Slot → Təsdiq

**Ssenari 2 — Vəkil görüşü təsdiqləyir:**  
`nigar@test.az` (vəkil portalı) → Panel → Gözlənilən görüşlər → Təsdiqlə

**Ssenari 3 — Çat:**  
`anar@test.az` → Çat → Kamran Əliyev ilə söhbət mövcuddur

**Ssenari 4 — Rəy:**  
`tural@test.az` → Görüşlər → Kamranla tamamlanmış görüş → Rəy yaz

**Ssenari 5 — Admin təsdiqləməsi:**  
`admin@legalconnect.az` → Vəkillər → Gözlənilən vəkili təsdiqləyin

## API

Əsas URL: `https://localhost:7777/api`  
Swagger: `https://localhost:7777/swagger`

| Endpoint | Təsvir |
|---|---|
| `POST /api/auth/register` | Qeydiyyat |
| `POST /api/auth/login` | Giriş |
| `GET /api/lawyers` | Vəkilləri axtarış (açıq) |
| `GET /api/appointments/client/{id}` | Müştəri görüşləri |
| `GET /api/appointments/lawyer/{id}` | Vəkil görüşləri |
| `GET /api/chats?userId={id}` | İstifadəçi çatları |
| `GET /api/slots/available?lawyerId={id}&date={date}` | Mövcud slotlar |
