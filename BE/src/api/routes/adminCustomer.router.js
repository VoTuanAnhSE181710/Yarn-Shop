import express from "express";
import { authentication, checkPermission } from "../middlewares/middleware.js";

const adminCustomerRouter = express.Router();

// All routes require authentication
adminCustomerRouter.use(authentication);

// GET /api/admin/customers
adminCustomerRouter.get("/", checkPermission("User", "read"), (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminGetAll(req, res, next);
});

// GET /api/admin/customers/:id
adminCustomerRouter.get("/:id", checkPermission("User", "read"), (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminGetById(req, res, next);
});

// PUT /api/admin/customers/:id  — requires User/update (not User/read!)
adminCustomerRouter.put("/:id", checkPermission("User", "update"), (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminUpdate(req, res, next);
});

// DELETE /api/admin/customers/:id  — requires User/delete (not User/read!)
adminCustomerRouter.delete("/:id", checkPermission("User", "delete"), (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.adminDelete(req, res, next);
});

export default adminCustomerRouter;