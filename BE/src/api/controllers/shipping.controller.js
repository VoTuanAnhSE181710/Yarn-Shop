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

  getShippingOptions = async (req, res, next) => {
    try {
      const { provinceName, districtName, wardName, lat, lng } = req.body;
      
      const options = [];

      // 1. Calculate Local Express (if lat/lng provided)
      if (lat !== undefined && lng !== undefined) {
        try {
          const check = await this.shippingService.checkDeliveryArea({ lat, lng });
          if (check.serviceable) {
            const fee = this.shippingService.calculateDeliveryFee(check.distanceKm);
            options.push({
              id: "LOCAL_EXPRESS",
              name: "Giao Hàng Hỏa Tốc",
              price: fee,
              eta: "2-4 giờ"
            });
          }
        } catch (err) {
          console.error("Local Express error:", err);
        }
      }

      // 2. Calculate GHN (if names are provided or successfully reverse-geocoded)
      let pName = provinceName;
      let dName = districtName;
      let wName = wardName;

      if (lat !== undefined && lng !== undefined && (!pName || !dName || !wName)) {
        try {
          const geocoded = await this.shippingService.reverseGeocode({ lat, lng });
          pName = pName || geocoded.province;
          dName = dName || geocoded.district;
          wName = wName || geocoded.commune;
        } catch (err) {
          console.error("Reverse geocode error:", err);
        }
      }

      if (pName && dName && wName) {
        try {
          const ghnService = req.container.resolve("ghnService");
          const fee = await ghnService.calculateFee({
            provinceName: pName,
            districtName: dName,
            wardName: wName
          });
          options.push({
            id: "GHN",
            name: "Giao Hàng Nhanh",
            price: fee,
            eta: "2-3 ngày"
          });
        } catch (err) {
          console.error("GHN calculate error:", err);
        }
      }

      res.status(200).json({ status: "success", data: { options } });
    } catch (error) {
      next(error);
    }
  };

  geocodeAddress = async (req, res, next) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ status: "fail", message: "Address is required" });
      }
      
      const geocodingService = req.container.resolve("geocodingService");
      const result = await geocodingService.geocode(address);
      
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  };
}
