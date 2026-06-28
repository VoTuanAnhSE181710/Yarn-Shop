import { NotFoundError, BadRequestError } from "../error/error.js";

export default class ProductService {
  #productRepository;

  constructor({ productRepository }) {
    this.#productRepository = productRepository;
  }

  async createProduct(data) {
    return this.#productRepository.create(data);
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

    return this.#productRepository.findAll({
      filter,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sortOption,
    });
  }

  async getProductById(id) {
    const product = await this.#productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  async updateProduct(id, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BadRequestError("Update data must not be empty");
    }

    const product = await this.#productRepository.update(id, updateData);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  async deleteProduct(id) {
    const product = await this.#productRepository.softDelete(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  async restoreProduct(id) {
    const product = await this.#productRepository.restore(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }
}
