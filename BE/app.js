import express from 'express';
import { scopePerRequest } from "awilix-express"
import cors from 'cors';
import container from './container.js';
import { handleError } from './src/api/middlewares/middleware.js';
import { swaggerUi, swaggerSpec } from './src/config/swagger.js';
import { configDotenv } from 'dotenv';
configDotenv()

const app = express();
// Trust reverse proxies (Render/Cloudflare) so req.secure/req.protocol are accurate
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(scopePerRequest(container)); //khi nguoi dung call api thi chi cung cap 1 lan

//import routes
import authRouter from "./src/api/routes/auth.router.js"
import userRouter from "./src/api/routes/user.router.js"
import permissionRouter from "./src/api/routes/permission.router.js"
import roleRouter from "./src/api/routes/role.router.js"
import mailRouter from "./src/api/routes/mail.router.js"
import logRouter from "./src/api/routes/log.router.js"
import videoRouter from "./src/api/routes/video.router.js"
import categoryRouter from "./src/api/routes/category.router.js"

app.get("/", (req, res) => {
    res.send(`Hello World!`);
})

const url = "/api/v1"

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Yarn Shop API Documentation'
}));

//use routes
app.use(`${url}/auth`, authRouter);
app.use(`${url}/users`, userRouter)
app.use(`${url}/permissions`, permissionRouter)
app.use(`${url}/roles`, roleRouter)
app.use(`${url}/mail`, mailRouter)
app.use(`${url}/logs`, logRouter)
app.use(`${url}/videos`, videoRouter)
app.use(`${url}/categories`, categoryRouter)

app.use(handleError)

export default app;