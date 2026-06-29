import { NotFoundError, BadRequestError } from "../error/error.js";

/**
 * Shape a product document (Mongoose doc or plain object — including those
 * returned from `.lean()`) into the JSON contract the frontend expects:
 *  - The legacy `images` field is dropped (the canonical picture is `image`).
 *  - `_id` and `id` are placed FIRST so the frontend can address the product.
 *  - Each variant's `_id` is exposed as `_idVariants` and placed FIRST.
 *  - Each variant's `image` is placed second (right after `_idVariants`).
 *
 * This mirrors the `transformProduct` transform on the model for fresh docs,
 * but also works on plain objects that came from `.lean()` (which bypass
 * `toJSON` transforms).
 */
function shapeProductForResponse(product) {
  if (!product || typeof product !== "object") return product;

  // Normalize to a plain object so we can reorder fields freely.
  let plain =
    typeof product.toObject === "function"
      ? product.toObject()
      : { ...product };

  // Strip the legacy `images` field if it somehow slipped through.
  if (Object.prototype.hasOwnProperty.call(plain, "images")) {
    delete plain.images;
  }

  // Reorder variants (expose `_idVariants`, place `_idVariants` and `image` first).
  if (Array.isArray(plain.variants)) {
    plain.variants = plain.variants.map(shapeVariantForResponse);
  }

  // Reorder product-level fields: `_id`, `id` first; everything else after.
  const { _id, id, ...rest } = plain;
  const ordered = {};
  if (_id !== undefined) ordered._id = String(_id);
  if (id !== undefined) ordered.id = typeof id === "string" ? id : String(id);
  for (const key of Object.keys(rest)) {
    if (key === "_id" || key === "id") continue;
    ordered[key] = rest[key];
  }
  return ordered;
}

/**
 * Shape a single variant: expose `_id` as `_idVariants` and place
 * `_idVariants` + `image` first.
 */
function shapeVariantForResponse(variant) {
  if (!variant || typeof variant !== "object") return variant;
  const plain =
    typeof variant.toObject === "function"
      ? variant.toObject()
      : { ...variant };

  const { _id, image, ...rest } = plain;
  const ordered = {};
  if (_id !== undefined) ordered._idVariants = String(_id);
  if (image !== undefined) ordered.image = image;
  for (const key of Object.keys(rest)) {
    if (key === "_id" || key === "image") continue;
    ordered[key] = rest[key];
  }
  return ordered;
}

export default class ProductService {
  #productRepository;

  constructor({ productRepository }) {
    this.#productRepository = productRepository;
  }

  /**
   * Normalize incoming product data:
   *  - Strip the legacy top-level `images` field when an `image` is also
   *    provided (i.e. when both exist, the `images` array is considered
   *    redundant and is removed to avoid duplicates).
   *  - Always strip the `images` field on the way to the database; the
   *    canonical picture for a product is its `image` (and each variant's
   *    own `image` field).
   */
  #normalizeProductData(data) {
    if (!data || typeof data !== "object") return data;

    // If a single `image` is provided we drop the `images` array entirely
    if (Object.prototype.hasOwnProperty.call(data, "images")) {
      if (data.image) {
        delete data.images;
      } else if (Array.isArray(data.images) && data.images.length === 1) {
        // If there's no `image` but exactly one entry in `images`, promote it
        data.image = data.images[0];
        delete data.images;
      } else {
        // Otherwise keep nothing; the variant-level images are enough
        delete data.images;
      }
    }

    return data;
  }

  async createProduct(data) {
    const normalized = this.#normalizeProductData({ ...data });
    const product = await this.#productRepository.create(normalized);
    return shapeProductForResponse(product);
  }

  async getProducts({
    category,
    tag,
    search,
    page = 1,
    limit = 20,
    sort = "newest",
    includeInactive = false,
  } = {}) {
    const filter = {};

    if (!includeInactive) {
      filter.isActive = true;
    }

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "name_asc":
        sortOption = { name: 1 };
        break;
      case "name_desc":
        sortOption = { name: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const result = await this.#productRepository.findAll({
      filter,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sortOption,
    });

    // `.lean()` in the repository returns plain objects; shape them so the
    // client gets the same `_idVariants` / `_id` / `id` shape as a fresh doc.
    result.products = (result.products || []).map(shapeProductForResponse);

    return result;
  }

  async getProductById(id) {
    const product = await this.#productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return shapeProductForResponse(product);
  }

  async updateProduct(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BadRequestError("Update data must not be empty");
    }

    const normalized = this.#normalizeProductData({ ...updateData });
    const product = await this.#productRepository.update(id, normalized);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return shapeProductForResponse(product);
  }

  async deleteProduct(id) {
    const product = await this.#productRepository.softDelete(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return shapeProductForResponse(product);
  }

  async restoreProduct(id) {
    const product = await this.#productRepository.restore(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return shapeProductForResponse(product);
  }
}
