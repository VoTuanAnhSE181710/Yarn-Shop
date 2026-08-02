import express from "express";
import { scopePerRequest } from "awilix-express";
import cors from "cors";
import container from "./container.js";
import { handleError } from "./src/api/middlewares/middleware.js";
import { swaggerUi, swaggerSpec } from "./src/config/swagger.js";
import rateLimit from "express-rate-limit";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
// Trust reverse proxies (Render/Cloudflare) so req.secure/req.protocol are accurate
app.set("trust proxy", 1);

const corsOptions = {
  origin: [
    "https://len-em.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "X-Requested-With"],
};

// CORS MUST be the very first middleware so OPTIONS preflight requests
// are short-circuited (with proper CORS headers) BEFORE they hit the
// authentication middleware. Otherwise the browser's preflight fails
// silently and the actual request is sent without the Authorization
// header, causing "Header is not containing information".
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { status: "error", message: "Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 15 phút." },
});
app.use("/api/", globalLimiter); // Apply to all API routes

app.use(scopePerRequest(container)); //khi nguoi dung call api thi chi cung cap 1 lan

//import routes
import authRouter from "./src/api/routes/auth.router.js";
import userRouter from "./src/api/routes/user.router.js";
import permissionRouter from "./src/api/routes/permission.router.js";
import roleRouter from "./src/api/routes/role.router.js";
import mailRouter from "./src/api/routes/mail.router.js";
import logRouter from "./src/api/routes/log.router.js";
import categoryRouter from "./src/api/routes/category.router.js";
import kitRouter from "./src/api/routes/kit.router.js";
import customerRouter from "./src/api/routes/customer.router.js";
import adminCustomerRouter from "./src/api/routes/adminCustomer.router.js";
import courseRouter from "./src/api/routes/course.router.js";
import paymentRouter from "./src/api/routes/payment.router.js";
import orderRouter from "./src/api/routes/order.router.js";
import productRouter from "./src/api/routes/product.router.js";
import diyPostRouter from "./src/api/routes/diyPost.router.js";
import orderReportRouter from "./src/api/routes/orderReport.router.js";
import videoRouter from "./src/api/routes/video.router.js";
import supportDIYRouter from "./src/api/routes/supportDIY.router.js";
import addressRouter from "./src/api/routes/address.router.js";
import refundInvoiceRouter from "./src/api/routes/refundInvoice.router.js";
import notificationRouter from "./src/api/routes/notification.router.js";
import messageRouter from "./src/api/routes/message.router.js";
import ghnRouter from "./src/api/routes/ghn.router.js";
import shippingRouter from "./src/api/routes/shipping.router.js";
import chatbotRouter from "./src/api/routes/chatbot.router.js";
import aiAgentRouter from "./src/modules/ai-agent/aiAgent.router.js";
import cartRouter from "./src/api/routes/cart.router.js";

app.get("/", (req, res) => {
  res.send(`Hello World!`);
});

const url = "/api/v1";

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Yarn Shop API Documentation",
  }),
);

//use routes
app.use(`${url}/auth`, authRouter);
app.use(`${url}/users`, userRouter);
app.use(`${url}/permissions`, permissionRouter);
app.use(`${url}/roles`, roleRouter);
app.use(`${url}/mail`, mailRouter);
app.use(`${url}/logs`, logRouter);
app.use(`${url}/categories`, categoryRouter);
app.use(`${url}/kits`, kitRouter);
app.use(`${url}/customers`, customerRouter);
app.use(`${url}/admin/customers`, adminCustomerRouter);
app.use(`${url}`, courseRouter);
app.use(`${url}/payment`, paymentRouter);
app.use(`${url}/orders`, orderRouter);
app.use(`${url}/products`, productRouter);
app.use(`${url}/diy-posts`, diyPostRouter);
app.use(`${url}/order-reports`, orderReportRouter);
app.use(`${url}/videos`, videoRouter);
app.use(`${url}/support-diy`, supportDIYRouter);
app.use(`${url}/addresses`, addressRouter);
app.use(`${url}/refund-invoices`, refundInvoiceRouter);
app.use(`${url}/notifications`, notificationRouter);
app.use(`${url}/messages`, messageRouter);
app.use(`${url}/ghn`, ghnRouter);
app.use(`${url}/shipping`, shippingRouter);
app.use(`${url}/chatbot`, chatbotRouter);
app.use(`${url}/cart`, cartRouter);
app.use(`${url}/ai-agent`, aiAgentRouter);

app.use(handleError);

export default app;
