import { NotFoundError, BadRequestError } from "../error/error.js";
import { transformProduct } from "../models/product.js";

export default class CartService {
  constructor({ cartRepository, productRepository }) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  async getCart(userId) {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = { user: userId, items: [] };
    }
    return this.populateCartItems(cart);
  }

  async syncCart(userId, items) {
    if (!Array.isArray(items)) {
      throw new BadRequestError("Items must be an array");
    }

    // Filter valid items structure
    const validItems = items
      .filter((item) => item.productId && item.variantId && item.quantity > 0)
      .map((item) => ({
        productId: String(item.productId),
        variantId: String(item.variantId),
        quantity: Number(item.quantity),
      }));

    // We replace the entire cart with the new items array.
    // If the frontend sends the merged array from localStorage, this effectively syncs it.
    const updatedCart = await this.cartRepository.upsertCart(userId, validItems);
    return this.populateCartItems(updatedCart);
  }

  async clearCart(userId) {
    const updatedCart = await this.cartRepository.clearCart(userId);
    return this.populateCartItems(updatedCart);
  }

  async populateCartItems(cart) {
    const items = cart.items || [];
    const populatedItems = [];
    let cartTotal = 0;

    for (const item of items) {
      const productDoc = await this.productRepository.findById(item.productId);
      if (!productDoc || !productDoc.isActive) {
        // Product no longer exists or is inactive, skip it (or could return an error flag)
        continue;
      }

      // Convert Mongoose doc to plain object and run transform manually for consistent shape
      let product = productDoc;
      if (typeof productDoc.toObject === "function") {
          product = productDoc.toObject({ transform: transformProduct, virtuals: true });
      }

      const variant = (product.variants || []).find(
        (v) => String(v._idVariants) === String(item.variantId) || String(v._id) === String(item.variantId)
      );

      if (!variant) {
        continue;
      }

      // Check stock (do not throw, just cap it to available stock so cart doesn't crash)
      const availableStock = variant.stock;
      const finalQuantity = Math.min(item.quantity, availableStock);

      if (finalQuantity <= 0) {
        continue; // Out of stock
      }

      const itemTotal = variant.price * finalQuantity;
      cartTotal += itemTotal;

      populatedItems.push({
        _id: item._id,
        productId: product.id || product._id,
        variantId: variant._idVariants || variant._id,
        quantity: finalQuantity,
        product: {
          id: product.id || product._id,
          name: product.name,
          image: product.image,
          category: product.category,
        },
        variant: {
          id: variant._idVariants || variant._id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          stock: availableStock,
          image: variant.image,
        },
        itemTotal,
      });
    }

    return {
      user: cart.user,
      items: populatedItems,
      cartTotal,
    };
  }
}
