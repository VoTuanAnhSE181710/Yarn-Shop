import express from "express";
import { scopePerRequest } from "awilix-express";
import cors from "cors";
import container from "./container.js";
import { handleError } from "./src/api/middlewares/middleware.js";
import { swaggerUi, swaggerSpec } from "./src/config/swagger.js";
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

app.use(handleError);

export default app;
