import { NotFoundError } from "../../error/error.js";

class ProductController {
  #productService;

  constructor({ productService }) {
    this.#productService = productService;
  }

  /**
   * POST /api/products - Create a new product
   * Access: Admin
   */
  create = async (req, res, next) => {
    try {
      const productData = req.body;

      const product = await this.#productService.createProduct(productData);

      res.status(201).json({
        status: "success",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/products - Get products list
   * - Public (no auth): only `isActive = true` products are returned.
   * - Admin (auth + Admin role): can pass `includeInactive=true` to also
   *   see inactive (soft-deleted) products.
   * Query: category, tag, search, page, limit, sort, includeInactive
   */
  getAll = async (req, res, next) => {
    try {
      const { category, tag, search, page, limit, sort, includeInactive } =
        req.query;

      // Only allow `includeInactive` for Admin users
      const isAdmin = req.user && req.user.roleName === "Admin";
      const includeInactiveFlag =
        isAdmin && (includeInactive === "true" || includeInactive === true);

      const result = await this.#productService.getProducts({
        category,
        tag,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort,
        includeInactive: includeInactiveFlag,
      });

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/products/:id - Get product by ID
   * - Public users: 404 if product is `isActive = false`.
   * - Admin users: can always get the product.
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await this.#productService.getProductById(id);

      const isAdmin = req.user && req.user.roleName === "Admin";
      if (!isAdmin && product.isActive === false) {
        throw new NotFoundError("Product not found");
      }

      res.status(200).json({
        status: "success",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/products/:id - Update product
   * Access: Admin
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await this.#productService.updateProduct(id, updateData);

      res.status(200).json({
        status: "success",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/products/:id - Soft delete product
   * Access: Admin
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await this.#productService.deleteProduct(id);

      res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/products/:id/restore - Restore a soft-deleted product
   * Access: Admin
   */
  restore = async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await this.#productService.restoreProduct(id);

      res.status(200).json({
        status: "success",
        message: "Product restored successfully",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ProductController;
