import Product from "../models/product.js";
import mongoose from "mongoose";

export default class ProductRepository {
  async create(data) {
    return Product.create(data);
  }

  async findById(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }
    return Product.findById(productId);
  }

  async findAll({
    filter = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
  } = {}) {
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(productId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }
    return Product.findByIdAndUpdate(productId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async softDelete(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }
    return Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { returnDocument: "after" },
    );
  }

  async restore(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }
    return Product.findByIdAndUpdate(
      productId,
      { isActive: true },
      { returnDocument: "after" },
    );
  }

  async hardDelete(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }
    return Product.findByIdAndDelete(productId);
  }
}
