import express from "express";
import { authentication, checkPermission } from "../middlewares/middleware.js";

const adminCustomerRouter = express.Router();

// All routes require auth + User read permission (admin customer management)
adminCustomerRouter.use(authentication);
adminCustomerRouter.use(checkPermission('User', 'read'));

// GET /api/admin/customers
adminCustomerRouter.get("/", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminGetAll(req, res, next);
});

// GET /api/admin/customers/:id
adminCustomerRouter.get("/:id", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminGetById(req, res, next);
});

// PUT /api/admin/customers/:id
adminCustomerRouter.put("/:id", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminUpdate(req, res, next);
});

// DELETE /api/admin/customers/:id
adminCustomerRouter.delete("/:id", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminDelete(req, res, next);
});

export default adminCustomerRouter;