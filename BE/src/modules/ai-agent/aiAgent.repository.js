import Address from "../../models/address.js";
import ChatSession from "../../models/chatSession.js";
import Product from "../../models/product.js";
import { createDefaultAgentState } from "./aiAgent.constants.js";

export default class AiAgentRepository {
  findSession(sessionId) {
    return ChatSession.findOne({ sessionId });
  }

  createSession({ sessionId, userId = null }) {
    return ChatSession.create({
      sessionId,
      userId: userId || null,
      agentState: createDefaultAgentState(),
    });
  }

  attachUser(sessionId, userId) {
    return ChatSession.findOneAndUpdate(
      { sessionId, userId: null },
      { $set: { userId } },
      { returnDocument: "after" },
    );
  }

  updateState(sessionId, state) {
    return ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          agentState: state,
          lastActivityAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  findProductById(productId) {
    return Product.findById(productId).lean();
  }

  findDefaultAddress(userId) {
    return Address.findOne({ user: userId, isDefault: true }).lean();
  }

  claimConfirmation({ sessionId, token, now = new Date() }) {
    return ChatSession.findOneAndUpdate(
      {
        sessionId,
        "agentState.pendingAction.token": token,
        "agentState.pendingAction.status": "PENDING",
        "agentState.pendingAction.expiresAt": { $gt: now },
      },
      {
        $set: {
          "agentState.pendingAction.status": "PROCESSING",
          lastActivityAt: now,
        },
      },
      { returnDocument: "after" },
    );
  }

  releaseConfirmation({ sessionId, token }) {
    return ChatSession.findOneAndUpdate(
      {
        sessionId,
        "agentState.pendingAction.token": token,
        "agentState.pendingAction.status": "PROCESSING",
      },
      {
        $set: {
          "agentState.pendingAction.status": "PENDING",
          lastActivityAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  completeOrder({ sessionId, order }) {
    return ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          "agentState.stage": "ORDER_CREATED",
          "agentState.cart": [],
          "agentState.quote": null,
          "agentState.pendingAction": null,
          "agentState.lastOrder": order,
          lastActivityAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }
}
