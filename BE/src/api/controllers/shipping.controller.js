export default class ShippingController {
  constructor({ shippingService }) {
    this.shippingService = shippingService;
  }

  getShopLocation = async (req, res, next) => {
    try {
      const shopLocation = await this.shippingService.getShopLocation();
      return res.status(200).json({
        status: "success",
        data: { shopLocation },
      });
    } catch (error) {
      next(error);
    }
  };

  updateShopLocation = async (req, res, next) => {
    try {
      const shopLocation = await this.shippingService.updateShopLocation(
        req.body,
      );
      return res.status(200).json({
        status: "success",
        message: "Shop location updated successfully",
        data: { shopLocation },
      });
    } catch (error) {
      next(error);
    }
  };

  reverseGeocode = async (req, res, next) => {
    try {
      const address = await this.shippingService.reverseGeocode(req.body);
      return res.status(200).json({
        status: "success",
        data: { address },
      });
    } catch (error) {
      next(error);
    }
  };

  checkDeliveryArea = async (req, res, next) => {
    try {
      const deliveryArea = await this.shippingService.checkDeliveryArea(
        req.body,
      );
      return res.status(200).json({
        status: "success",
        data: deliveryArea,
      });
    } catch (error) {
      next(error);
    }
  };

  calculateQuote = async (req, res, next) => {
    try {
      const quote = await this.shippingService.calculateQuote(req.body);
      return res.status(200).json({
        status: "success",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  };
}
