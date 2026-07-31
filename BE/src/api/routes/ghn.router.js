import express from 'express';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GHN
 *   description: GHN master data for building address dropdowns (Province → District → Ward)
 */

/**
 * @swagger
 * /ghn/provinces:
 *   get:
 *     summary: Get all provinces/cities
 *     description: Returns all Vietnamese provinces/cities from GHN master data. Use this to populate the first dropdown when user selects delivery address.
 *     tags: [GHN]
 *     responses:
 *       200:
 *         description: List of provinces
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
 *                     provinces:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provinceId:
 *                             type: number
 *                           provinceName:
 *                             type: string
 */
router.get(
    "/provinces",
    cacheMiddleware(86400), // Cache for 24 hours
    async (req, res, next) => {
        try {
            const ghnService = req.container.resolve("ghnService");
            const provinces = await ghnService.getProvinces();
            res.status(200).json({ status: "success", data: { provinces } });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /ghn/districts:
 *   get:
 *     summary: Get districts by province
 *     description: Returns all districts/towns of a given province. Call this after user selects a province.
 *     tags: [GHN]
 *     parameters:
 *       - in: query
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GHN Province ID from /ghn/provinces
 *     responses:
 *       200:
 *         description: List of districts
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
 *                     districts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           districtId:
 *                             type: number
 *                           districtName:
 *                             type: string
 *                           provinceId:
 *                             type: number
 */
router.get(
    "/districts",
    cacheMiddleware(86400), // Cache for 24 hours
    async (req, res, next) => {
        try {
            const { provinceId } = req.query;
            if (!provinceId) {
                return res.status(400).json({ status: "fail", message: "provinceId is required" });
            }
            const ghnService = req.container.resolve("ghnService");
            const districts = await ghnService.getDistricts(provinceId);
            res.status(200).json({ status: "success", data: { districts } });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /ghn/wards:
 *   get:
 *     summary: Get wards by district
 *     description: Returns all wards/communes of a given district. Call this after user selects a district.
 *     tags: [GHN]
 *     parameters:
 *       - in: query
 *         name: districtId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GHN District ID from /ghn/districts
 *     responses:
 *       200:
 *         description: List of wards
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
 *                     wards:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           wardCode:
 *                             type: string
 *                           wardName:
 *                             type: string
 *                           districtId:
 *                             type: number
 */
router.get(
    "/wards",
    cacheMiddleware(86400), // Cache for 24 hours
    async (req, res, next) => {
        try {
            const { districtId } = req.query;
            if (!districtId) {
                return res.status(400).json({ status: "fail", message: "districtId is required" });
            }
            const ghnService = req.container.resolve("ghnService");
            const wards = await ghnService.getWards(districtId);
            res.status(200).json({ status: "success", data: { wards } });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /ghn/map-address:
 *   post:
 *     summary: Map string address to GHN IDs
 *     description: Takes raw strings (e.g. from Google Maps API) and performs a fuzzy search to find the matching GHN provinceId, districtId, and wardCode.
 *     tags: [GHN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provinceName:
 *                 type: string
 *                 example: "Thành phố Hồ Chí Minh"
 *               districtName:
 *                 type: string
 *                 example: "Quận 1"
 *               wardName:
 *                 type: string
 *                 example: "Phường Bến Nghé"
 *               lat:
 *                 type: number
 *                 description: "Optional: Latitude. If provided with lng, system will reverse geocode and ignore names."
 *               lng:
 *                 type: number
 *                 description: "Optional: Longitude."
 *     responses:
 *       200:
 *         description: Match result
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
 *                     match:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         message:
 *                           type: string
 *                         provinceId:
 *                           type: integer
 *                         districtId:
 *                           type: integer
 *                         wardCode:
 *                           type: string
 */
router.post(
    "/map-address",
    async (req, res, next) => {
        try {
            const { provinceName, districtName, wardName, lat, lng } = req.body;
            
            let pName = provinceName;
            let dName = districtName;
            let wName = wardName;

            if (lat !== undefined && lng !== undefined) {
                const shippingService = req.container.resolve("shippingService");
                const geocoded = await shippingService.reverseGeocode({ lat, lng });
                pName = geocoded.province;
                dName = geocoded.district;
                wName = geocoded.commune;
            }

            if (!pName || !dName || !wName) {
                return res.status(400).json({ status: "fail", message: "Either (provinceName, districtName, wardName) or (lat, lng) are required to map address" });
            }

            const ghnService = req.container.resolve("ghnService");
            const match = await ghnService.mapAddressToGHN({ provinceName: pName, districtName: dName, wardName: wName });
            res.status(200).json({ status: "success", data: { match } });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
