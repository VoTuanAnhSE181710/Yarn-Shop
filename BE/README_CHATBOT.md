# Yarn Shop Customer Chatbot API

Backend-first chatbot for Learn, Shop, DIY, website guidance, order support,
admin contact, and human handoff.

## Design

- Guided select flows are the primary interaction and work without an AI key.
- MongoDB is the source of truth for products, price, stock, ratings, courses,
  videos, kits, DIY posts, and enrollment status.
- Gemini is optional and is only used to route unclear free-text questions.
- Gemini is not allowed to invent price, stock, ratings, policies, medical
  claims, or admin contact details.
- Anonymous sessions are supported. A valid Bearer token adds enrollment
  context for authenticated customers.

## Environment

Copy the variables in `.env.chatbot.example` into the existing `.env`.

The API works in `GUIDED_FALLBACK` mode when `GEMINI_API_KEY` is empty.
Configure `ADMIN_EMAIL`, `ADMIN_PHONE`, or another official channel before
enabling the contact and handoff features in production.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/chatbot/health` | Check chatbot and Gemini mode |
| GET | `/api/v1/chatbot/menu` | Get menu and select-flow definitions |
| POST | `/api/v1/chatbot/sessions` | Start a chat session |
| POST | `/api/v1/chatbot/messages` | Send a guided action or free text |
| POST | `/api/v1/chatbot/recommendations/learn` | Query courses and videos |
| POST | `/api/v1/chatbot/recommendations/shop` | Rank in-stock products |
| POST | `/api/v1/chatbot/recommendations/diy` | Query kits and DIY posts |
| GET | `/api/v1/chatbot/admin-contact` | Get configured official channels |
| POST | `/api/v1/chatbot/handoff` | Request human support |

Swagger also exposes these endpoints at `http://localhost:3000/api-docs`.

## Quick test

Start the backend, then create a session:

```http
POST http://localhost:3000/api/v1/chatbot/sessions
Content-Type: application/json

{}
```

Use the returned `sessionId` for a free-text question:

```http
POST http://localhost:3000/api/v1/chatbot/messages
Content-Type: application/json

{
  "sessionId": "PASTE_SESSION_ID",
  "message": "Bà bầu nên mua len cotton nào dưới 500k?",
  "action": "FREE_TEXT",
  "answers": {}
}
```

Request a guided Shop flow:

```http
POST http://localhost:3000/api/v1/chatbot/messages
Content-Type: application/json

{
  "sessionId": "PASTE_SESSION_ID",
  "action": "SHOP_START",
  "answers": {}
}
```

Submit the selected Shop answers:

```http
POST http://localhost:3000/api/v1/chatbot/messages
Content-Type: application/json

{
  "sessionId": "PASTE_SESSION_ID",
  "action": "SHOP_RECOMMEND",
  "answers": {
    "recipient": "pregnant",
    "project": "scarf",
    "material": "cotton",
    "maxPrice": 500000
  }
}
```

## Test

Run the chatbot unit tests from `BE`:

```bash
node --test test/chatbot.service.test.js
```

The tests use an in-memory fake repository and do not need MongoDB, Redis, or a
Gemini key.
