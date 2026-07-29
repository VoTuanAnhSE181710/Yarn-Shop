import Joi from "joi";

const latitude = Joi.number().min(-90).max(90).required().messages({
  "any.required": "lat is required",
  "number.base": "lat must be a number",
  "number.min": "lat must be between -90 and 90",
  "number.max": "lat must be between -90 and 90",
});

const longitude = Joi.number().min(-180).max(180).required().messages({
  "any.required": "lng is required",
  "number.base": "lng must be a number",
  "number.min": "lng must be between -180 and 180",
  "number.max": "lng must be between -180 and 180",
});

const deliveryPolicySchema = Joi.object({
  enabled: Joi.boolean().optional(),
  maxDistanceKm: Joi.number().min(0).optional(),
  baseDistanceKm: Joi.number().min(0).optional(),
  baseFee: Joi.number().min(0).optional(),
  feePerKm: Joi.number().min(0).optional(),
  minFee: Joi.number().min(0).optional(),
  maxFee: Joi.number().min(0).optional(),
  freeShippingThreshold: Joi.number().min(0).optional(),
})
  .min(1)
  .unknown(false);

export const updateShopLocationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  address: Joi.string().trim().min(5).max(500).optional(),
  communeName: Joi.string().trim().max(150).optional(),
  provinceName: Joi.string().trim().max(150).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  isActive: Joi.boolean().optional(),
  reverseGeocode: Joi.boolean().optional(),
  deliveryPolicy: deliveryPolicySchema.optional(),
})
  .min(1)
  .unknown(false)
  .custom((value, helpers) => {
    const policy = value.deliveryPolicy;
    if (
      policy?.minFee !== undefined &&
      policy?.maxFee !== undefined &&
      policy.minFee > policy.maxFee
    ) {
      return helpers.message({
        custom: "deliveryPolicy.minFee cannot be greater than maxFee",
      });
    }
    return value;
  });

export const coordinatesSchema = Joi.object({
  lat: latitude,
  lng: longitude,
}).unknown(false);

export const shippingQuoteSchema = Joi.object({
  lat: latitude,
  lng: longitude,
  orderValue: Joi.number().min(0).default(0).optional(),
}).unknown(false);
