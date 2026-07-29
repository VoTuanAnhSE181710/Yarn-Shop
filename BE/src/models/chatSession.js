import mongoose from "mongoose";

const chatOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    action: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    text: { type: String, required: true },
    intent: { type: String, default: null },
    action: { type: String, default: null },
    options: { type: [chatOptionSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "HANDOFF", "CLOSED"],
      default: "ACTIVE",
      index: true,
    },
    currentIntent: { type: String, default: "WELCOME" },
    profile: {
      level: { type: String, default: null },
      recipient: { type: String, default: null },
      project: { type: String, default: null },
      material: { type: String, default: null },
      budget: { type: Number, default: null },
      preferredDuration: { type: Number, default: null },
    },
    agentState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    messages: { type: [chatMessageSchema], default: [] },
    handoff: {
      requestedAt: { type: Date, default: null },
      reason: { type: String, default: null },
    },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

const ChatSession = mongoose.model(
  "ChatSession",
  chatSessionSchema,
  "chat_sessions",
);

export default ChatSession;
