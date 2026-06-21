import express from "express";
import { authentication } from "../middlewares/middleware.js";

const customerRouter = express.Router();

// Public routes
customerRouter.post("/register", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.register(req, res, next);
});

customerRouter.post("/login", (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.login(req, res, next);
});

// Protected routes (auth required)
customerRouter.get("/me", authentication, (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.getMe(req, res, next);
});

customerRouter.put("/me", authentication, (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.updateMe(req, res, next);
});

customerRouter.put("/me/password", authentication, (req, res, next) => {
    const controller = req.container.resolve("customerController");
    controller.changePassword(req, res, next);
});

export default customerRouter;