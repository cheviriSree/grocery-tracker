# Grocery Tracker App

A full-stack mobile app for tracking grocery items with expiry dates and barcode scanning.

## Features

- Add and delete grocery items
- Assign categories (Produce, Dairy, Pantry, Frozen, General)
- Mark items as purchased (strikethrough)
- **Barcode scanning** — scan a product barcode to auto-fill the item name via Open Food Facts
- **Expiry date tracking** — set and edit expiry dates per item with a native date picker
- **Color-coded expiry badges** — red (expired), orange (expires within 3 days), green (fresh)

## Project Structure

```
apps/
├── grocery-backend/     Express.js REST API + PostgreSQL
└── grocery-frontend/    React Native / Expo mobile app
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Expo Go](https://expo.dev/go) on your phone (iOS or Android)

---

## Backend Setup

```bash
cd grocery-backend
npm install
```

Create a `.env` file (one already exists with defaults):
```
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=grocery_db
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Start the server

```bash
node index.js
```

The server runs on **port 3000**. On first start, `initDB()` automatically creates the `items` table and applies any missing column migrations.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/groceries` | List all items |
| POST | `/groceries` | Add an item |
| DELETE | `/groceries/:id` | Delete an item |
| PATCH | `/items/:id/toggle` | Toggle purchased status |
| PATCH | `/groceries/:id/expiry` | Update expiry date |
| GET | `/health` | Health check |

**POST /groceries body:**
```json
{
  "name": "Milk",
  "category": "Dairy",
  "quantity": 1,
  "expiry_date": "2026-04-30"
}
```

---

## Frontend Setup

```bash
cd grocery-frontend
npm install
```

Update the API base URL in [app/(tabs)/index.js](grocery-frontend/app/(tabs)/index.js) to match your machine's local IP:

```js
const BASE_URL = 'http://<YOUR_LOCAL_IP>:3000';
```

### Start Expo

```bash
npx expo start
```

Open **Expo Go** on your phone (same WiFi network) and scan the QR code, or enter the URL manually:
```
exp://<YOUR_LOCAL_IP>:8081
```

---

## Database Schema

```sql
CREATE TABLE items (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  quantity     INTEGER      DEFAULT 1,
  category     VARCHAR(50)  DEFAULT 'General',
  is_completed BOOLEAN      DEFAULT FALSE,
  expiry_date  DATE
);
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo SDK 54 |
| Routing | Expo Router (file-based) |
| Backend | Express.js 5 |
| Database | PostgreSQL 13 (Docker) |
| Barcode scanning | expo-camera (CameraView) |
| Date picker | @react-native-community/datetimepicker |
| Product lookup | Open Food Facts API (free, no key needed) |
