# Yarn Shop AI Agent

The Agent is a Backend module that coordinates existing Yarn Shop services.
It does not duplicate product prices, stock rules, shipping rules or order
creation logic.

## Safety boundary

- Gemini may plan read-only recommendation actions.
- Cart, address and checkout mutations require structured actions.
- Creating an order requires authentication, `Order:create` permission and a
  one-time confirmation token.
- Product prices and stock are recalculated by `OrderService` at confirmation.
- Payment credentials, OTP, card number and CVV must never be sent to the
  Agent.

## API flow

1. `POST /api/v1/ai-agent/sessions`
2. `POST /api/v1/ai-agent/messages` with `RECOMMEND_SHOP`
3. `POST /api/v1/ai-agent/messages` with `ADD_TO_CART`
4. `POST /api/v1/ai-agent/messages` with `SET_SHIPPING`
5. `POST /api/v1/ai-agent/messages` with `PREPARE_CHECKOUT`
6. Show the returned draft to the customer.
7. `POST /api/v1/ai-agent/confirm` with the one-time confirmation token.

The confirmation token expires after 15 minutes and can only be claimed once.
