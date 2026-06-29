import { NotFoundError, BadRequestError } from "../error/error.js";

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
    return this.#productRepository.create(normalized);
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
