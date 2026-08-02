import Cart from "../models/cart.js";
import mongoose from "mongoose";

export default class CartRepository {
  async findByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    // We don't populate here because the service will manually fetch products to validate them.
    return Cart.findOne({ user: userId }).lean();
  }

  async upsertCart(userId, items) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  }

  async clearCart(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    ).lean();
  }
}
