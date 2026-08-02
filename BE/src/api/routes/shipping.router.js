import express from "express";
import {
  authentication,
  checkPermission,
  validateData,
} from "../middlewares/middleware.js";
import {
  coordinatesSchema,
  shippingQuoteSchema,
  updateShopLocationSchema,
} from "../../validators/shipping.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Shop location, reverse geocoding, delivery-area checks and distance-based shipping quotes
 *
 * components:
 *   schemas:
 *     Coordinates:
 *       type: object
 *       required: [lat, lng]
 *       properties:
 *         lat:
 *           type: number
 *           example: 10.357225
 *         lng:
 *           type: number
 *           example: 106.244531
 *     DeliveryPolicy:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *         maxDistanceKm:
 *           type: number
 *         baseDistanceKm:
 *           type: number
 *         baseFee:
 *           type: number
 *         feePerKm:
 *           type: number
 *         minFee:
 *           type: number
 *         maxFee:
 *           type: number
 *         freeShippingThreshold:
 *           type: number
 *     ShopLocation:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         communeName:
 *           type: string
 *         provinceName:
 *           type: string
 *         lat:
 *           type: number
 *         lng:
 *           type: number
 *         isActive:
 *           type: boolean
 *         deliveryPolicy:
 *           $ref: '#/components/schemas/DeliveryPolicy'
 */

/**
 * @swagger
 * /shipping/shop-location:
 *   get:
 *     summary: Get the shop origin
 *     description: Returns the primary shop location. On the first call, the approved Vĩnh Kim location is inserted into MongoDB.
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: Shop location retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopLocation:
 *                       $ref: '#/components/schemas/ShopLocation'
 */
router.get("/shop-location", async (req, res, next) => {
  const controller = req.container.resolve("shippingController");
  await controller.getShopLocation(req, res, next);
});

/**
 * @swagger
 * /shipping/shop-location:
 *   put:
 *     summary: Update the shop origin and delivery policy
 *     description: Staff/Admin only. Set reverseGeocode=true to rebuild the address from lat/lng.
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               communeName:
 *                 type: string
 *               provinceName:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               reverseGeocode:
 *                 type: boolean
 *               deliveryPolicy:
 *                 $ref: '#/components/schemas/DeliveryPolicy'
 *           example:
 *             name: Yarn Shop Vĩnh Kim
 *             address: Trung tâm Phục vụ Hành chính công xã Vĩnh Kim, ấp Vĩnh Thạnh, xã Vĩnh Kim, tỉnh Đồng Tháp
 *             communeName: Xã Vĩnh Kim
 *             provinceName: Tỉnh Đồng Tháp
 *             lat: 10.357225
 *             lng: 106.244531
 *             isActive: true
 *             deliveryPolicy:
 *               enabled: true
 *               maxDistanceKm: 100
 *               baseDistanceKm: 5
 *               baseFee: 15000
 *               feePerKm: 2500
 *               minFee: 15000
 *               maxFee: 150000
 *               freeShippingThreshold: 500000
 *     responses:
 *       200:
 *         description: Shop location updated
 *       400:
 *         description: Invalid configuration
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing Order update permission
 */
router.put(
  "/shop-location",
  authentication,
  checkPermission("Order", "update"),
  validateData(updateShopLocationSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.updateShopLocation(req, res, next);
  },
);

/**
 * @swagger
 * /shipping/reverse-geocode:
 *   post:
 *     summary: Convert lat/lng into a readable address
 *     description: Uses OpenStreetMap Nominatim. Authentication prevents public abuse of the external service.
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coordinates'
 *     responses:
 *       200:
 *         description: Address found
 *       400:
 *         description: Invalid coordinates or address not found
 *       401:
 *         description: Unauthorized
 *       502:
 *         description: Geocoding provider unavailable
 */
router.post(
  "/reverse-geocode",
  authentication,
  validateData(coordinatesSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.reverseGeocode(req, res, next);
  },
);

/**
 * @swagger
 * /shipping/check-area:
 *   post:
 *     summary: Check whether a destination can be delivered
 *     description: Calculates Haversine distance from the shop and compares it with maxDistanceKm.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coordinates'
 *     responses:
 *       200:
 *         description: Delivery-area result
 *       400:
 *         description: Invalid coordinates
 */
router.post(
  "/check-area",
  validateData(coordinatesSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.checkDeliveryArea(req, res, next);
  },
);

/**
 * @swagger
 * /shipping/quote:
 *   post:
 *     summary: Calculate a distance-based shipping quote
 *     description: Returns serviceability, distance, fee, free-shipping status and estimated delivery days.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Coordinates'
 *               - type: object
 *                 properties:
 *                   orderValue:
 *                     type: number
 *                     minimum: 0
 *                     example: 250000
 *     responses:
 *       200:
 *         description: Shipping quote calculated
 *       400:
 *         description: Invalid coordinates or order value
 */
router.post(
  "/quote",
  validateData(shippingQuoteSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.calculateQuote(req, res, next);
  },
);

/**
 * @swagger
 * /shipping/options:
 *   post:
 *     summary: Get all available shipping options (GHN & Local Express)
 *     description: Returns a combined array of all available shipping methods and their prices.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provinceName:
 *                 type: string
 *               districtName:
 *                 type: string
 *               wardName:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shipping options retrieved
 */
router.post(
  "/options",
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.getShippingOptions(req, res, next);
  },
);

/**
 * @swagger
 * /shipping/geocode:
 *   post:
 *     summary: Convert address string into lat/lng
 *     description: Uses OpenStreetMap Nominatim.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address]
 *             properties:
 *               address:
 *                 type: string
 *                 example: "120 Võ Văn Ngân, Thủ Đức"
 *     responses:
 *       200:
 *         description: Coordinates found
 *       400:
 *         description: Address not found
 */
router.post(
  "/geocode",
  async (req, res, next) => {
    const controller = req.container.resolve("shippingController");
    await controller.geocodeAddress(req, res, next);
  },
);

export default router;
