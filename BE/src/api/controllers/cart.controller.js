export default class CartController {
  constructor({ cartService }) {
    this.cartService = cartService;
  }

  getCart = async (req, res, next) => {
    try {
      const cart = await this.cartService.getCart(req.user._id);
      res.status(200).json({ status: "success", data: { cart } });
    } catch (error) {
      next(error);
    }
  };

  syncCart = async (req, res, next) => {
    try {
      const { items } = req.body;
      const cart = await this.cartService.syncCart(req.user._id, items);
      res.status(200).json({ status: "success", data: { cart } });
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req, res, next) => {
    try {
      const cart = await this.cartService.clearCart(req.user._id);
      res.status(200).json({ status: "success", data: { cart } });
    } catch (error) {
      next(error);
    }
  };
}
