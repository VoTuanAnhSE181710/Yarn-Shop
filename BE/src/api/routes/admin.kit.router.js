import express from 'express';
// import { authentication, checkPermission } from '../middlewares/middleware.js';

const router = express.Router();

// Apply authentication and permissions middlewares if necessary
// router.use(authentication);
// router.use(checkPermission('Kit', 'manage'));

router.post(
    "/",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.createKit(req, res, next);
    }
);

router.put(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.updateKit(req, res, next);
    }
);

router.delete(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.deleteKit(req, res, next);
    }
);

export default router;
