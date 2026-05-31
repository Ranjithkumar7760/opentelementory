# ShopPOC - E-Commerce Microservices Demo

A proof-of-concept e-commerce application built with **React** frontend and **Flask** microservices, all running in Docker containers.

## Architecture

```
Auth Service (port 5001) — JWT login/validation
    ↓
Order Service (port 5002) — create orders (status: pending)
    ↓
Payment Service (port 5003) — mock payment (user-initiated)
    ↓
Notification Service (port 5004) — send confirmation
    ↓
User Service (port 5005) — update order history
```

Each service is an independent container. The frontend (Nginx + React) proxies API requests to the correct backend.

## Flow

1. **Sign In** → Auth Service returns JWT token
2. **Browse products** → Add items to cart
3. **Place Order** → Order Service creates order with `pending` status
4. **Pay Now** → User initiates payment via Payment Service
   - Payment Service updates Order Service → `paid`
   - Payment Service calls Notification Service
   - Payment Service calls User Service (history)

## Run

```bash
docker compose up -d
```

Then open **http://localhost:3000**

## Credentials

| Username | Password |
|----------|----------|
| `demo`   | `demo123`|
| `user1`  | `pass123`|

## Tech Stack

- **Frontend:** React 18 (built into Nginx image)
- **Backend:** Flask 3.0 (Python 3.11)
- **Auth:** JWT (PyJWT)
- **Containers:** Docker Compose
- **Storage:** In-memory (POC — no database)
