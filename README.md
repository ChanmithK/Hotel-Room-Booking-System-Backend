# Kenora Hotel Booking System — Backend

REST API built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB (local)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Environment:** dotenv

---

## Project Structure

```
server/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, get me, seed admin
│   │   ├── user.controller.js       # CRUD for staff accounts
│   │   ├── room.controller.js       # CRUD for rooms + availability
│   │   └── booking.controller.js    # Create, cancel, status updates
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT verify + role-based access
│   ├── models/
│   │   ├── User.js                  # Staff accounts (admin/manager/receptionist)
│   │   ├── Room.js                  # Hotel rooms
│   │   └── Booking.js               # Bookings with full history
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── room.routes.js
│   │   └── booking.routes.js
│   └── index.js                     # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18 or higher → https://nodejs.org
- **MongoDB** running locally on port 27017

### Start MongoDB

**macOS (Homebrew):**

```bash
brew services start mongodb-community
```

**Ubuntu / Debian:**

```bash
sudo systemctl start mongod
```

**Windows:**

```bash
net start MongoDB
```

**Verify MongoDB is running:**

```bash
mongosh
# Should connect and show a prompt. Type exit to quit.
```

---

## Installation

### 1. Clone and navigate to server folder

```bash
git clone https://github.com/ChanmithK/Hotel-Room-Booking-System-Backend.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hotel_booking
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

> **Important:** Change `JWT_SECRET` to a long random string in production.

### 4. Start the server

**Development (with auto-restart):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server will run at: **http://localhost:5000**

---

## Seeding — Create Default Admin

After the server is running, you need to create the first admin account. This only needs to be done **once**.

**Option 1 — curl:**

```bash
curl -X POST http://localhost:5000/api/auth/seed
```

**Option 2 — Postman / Thunder Client:**

- Method: `POST`
- URL: `http://localhost:5000/api/auth/seed`
- No body needed

**Option 3 — Browser (httpie or similar):**

```bash
http POST http://localhost:5000/api/auth/seed
```

**Expected response:**

```json
{
  "message": "Admin created",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@hotel.com",
    "role": "admin"
  }
}
```

**Default admin credentials:**

```
Email:    admin@hotel.com
Password: admin123
```

> If you call `/seed` again it returns `"Admin already exists"` — that is expected.

---

## API Endpoints

### Auth

| Method | Endpoint          | Access    | Description                     |
| ------ | ----------------- | --------- | ------------------------------- |
| POST   | `/api/auth/login` | Public    | Login with email & password     |
| GET    | `/api/auth/me`    | All roles | Get current logged-in user      |
| POST   | `/api/auth/seed`  | Public    | Create default admin (one-time) |

**Login request body:**

```json
{
  "email": "admin@hotel.com",
  "password": "admin123"
}
```

**Login response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@hotel.com",
    "role": "admin"
  }
}
```

---

### Users

All user routes require `Authorization: Bearer <token>` header.

| Method | Endpoint              | Access         | Description              |
| ------ | --------------------- | -------------- | ------------------------ |
| GET    | `/api/users`          | Admin          | Get all staff accounts   |
| POST   | `/api/users`          | Admin          | Create new staff account |
| PUT    | `/api/users/:id`      | Admin          | Update staff details     |
| DELETE | `/api/users/:id`      | Admin          | Delete staff account     |
| PATCH  | `/api/users/:id/role` | Admin, Manager | Change staff role        |

**Create user body:**

```json
{
  "name": "Jane Smith",
  "email": "jane@hotel.com",
  "password": "password123",
  "role": "receptionist"
}
```

---

### Rooms

| Method | Endpoint               | Access    | Description                       |
| ------ | ---------------------- | --------- | --------------------------------- |
| GET    | `/api/rooms`           | All roles | Get all rooms (with filters)      |
| GET    | `/api/rooms/available` | All roles | Get available rooms by date range |
| GET    | `/api/rooms/:id`       | All roles | Get single room                   |
| POST   | `/api/rooms`           | Manager   | Create new room                   |
| PUT    | `/api/rooms/:id`       | Manager   | Update room                       |
| DELETE | `/api/rooms/:id`       | Manager   | Soft-delete room                  |

**Filter rooms query params:**

```
GET /api/rooms?type=suite&floor=2&status=available
```

**Available rooms query params:**

```
GET /api/rooms/available?checkIn=2025-02-01&checkOut=2025-02-05&type=double&capacity=2
```

**Create room body:**

```json
{
  "roomNumber": "101",
  "type": "double",
  "floor": 1,
  "capacity": 2,
  "pricePerNight": 120,
  "status": "available",
  "amenities": ["WiFi", "TV", "AC"],
  "description": "Standard double room with garden view"
}
```

**Room types:** `single` `double` `twin` `suite` `deluxe` `family`

**Room statuses:** `available` `occupied` `cleaning` `maintenance` `out_of_service`

---

### Bookings

| Method | Endpoint                   | Access                | Description           |
| ------ | -------------------------- | --------------------- | --------------------- |
| GET    | `/api/bookings`            | Manager, Receptionist | Get all bookings      |
| GET    | `/api/bookings/:id`        | Manager, Receptionist | Get single booking    |
| POST   | `/api/bookings`            | Manager, Receptionist | Create new booking    |
| PATCH  | `/api/bookings/:id/cancel` | Manager, Receptionist | Cancel a booking      |
| PATCH  | `/api/bookings/:id/status` | Manager, Receptionist | Update booking status |

**Create booking body:**

```json
{
  "roomId": "<room_id>",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+1234567890",
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "specialRequests": "Late check-in requested"
}
```

**Cancel booking body:**

```json
{
  "cancellationReason": "Guest requested cancellation"
}
```

**Update status body:**

```json
{
  "status": "checked_in"
}
```

**Booking statuses:** `confirmed` → `checked_in` → `checked_out` or `cancelled`

---

## Role Permissions Summary

| Action                         | Admin | Manager | Receptionist |
| ------------------------------ | ----- | ------- | ------------ |
| Manage user accounts           | ✅    | ❌      | ❌           |
| Assign & change roles          | ✅    | ✅      | ❌           |
| Add, edit & remove rooms       | ❌    | ✅      | ❌           |
| Book & cancel bookings         | ❌    | ✅      | ✅           |
| View rooms, bookings & history | ❌    | ✅      | ✅           |

---

## Health Check

```bash
curl http://localhost:5000/api/health
# { "status": "OK" }
```

---
