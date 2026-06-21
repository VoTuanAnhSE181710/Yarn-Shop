import express from 'express';
// import { authentication } from '../middlewares/middleware.js'; // Uncomment if authentication is required for viewing

const router = express.Router();

router.get(
    "/",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.getAllKits(req, res, next);
    }
);

router.get(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.getKitById(req, res, next);
    }
);

export default router;
