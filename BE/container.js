import { createContainer, asClass, asValue, Lifetime } from "awilix"

//import Models
import { Role, Permission, User } from "./src/models/Model.js"

//import Controller
import AuthController from "./src/api/controllers/auth.controller.js"
import UserController from "./src/api/controllers/user.controller.js";
import PermissionController from "./src/api/controllers/permission.controller.js";
import RoleController from "./src/api/controllers/role.controller.js";
import MailController from "./src/api/controllers/mail.controller.js";
import VideoController from "./src/api/controllers/video.controller.js";
import CourseController from "./src/api/controllers/course.controller.js";
import LessonController from "./src/api/controllers/lesson.controller.js";

//import Service
import AuthService from "./src/services/auth.service.js";
import HashService from "./src/services/hash.service.js";
import TokenService from "./src/services/token.service.js";
import UserService from "./src/services/user.service.js";
import PermissionService from "./src/services/permission.service.js";
import RoleService from "./src/services/role.service.js";
import MailService from "./src/services/mail.service.js";
import VideoService from "./src/services/video.service.js";
import CourseService from "./src/services/course.service.js";
import LessonService from "./src/services/lesson.service.js";

//import Repositories
import RefreshTokenRepository from "./src/repositories/refreshToken.repository.js";
import UserRepository from "./src/repositories/user.repository.js";
import PermissionRepository from "./src/repositories/permission.repository.js";
import RoleRepository from "./src/repositories/role.repository.js";
import LogRepository from "./src/repositories/log.repository.js";

//3rd party
import redisClient from "./src/utils/redisClient.js";
import transporter from "./src/utils/emailTransporter.js";
import constants from "./src/constants/constants.js";
import cloudinary from "./src/utils/cloudinary.js";

const container = createContainer();

export function setupContainer({ io, notificationNamespace, chatNamespace }) {
    container.register({
        //asValue de dang ki cho nhung gia tri khoi tao san
        io: asValue(io),

        notifications: asValue(notificationNamespace, {
            lifetime: Lifetime.SINGLETON,
        }),
        chatNamespace: asValue(chatNamespace, {
            lifetime: Lifetime.SINGLETON,
        }),

        redis: asValue(redisClient, { lifetime: Lifetime.SINGLETON }),

        constants: asValue(constants, { lifetime: Lifetime.SINGLETON }),

        transporter: asValue(transporter, { lifetime: Lifetime.SINGLETON }),
        cloudinary: asValue(cloudinary, { lifetime: Lifetime.SINGLETON }),

        //Repositories
        refreshTokenRepository: asClass(RefreshTokenRepository, {
            lifetime: Lifetime.SCOPED,
        }),
        userRepository: asClass(UserRepository, {
            lifetime: Lifetime.SCOPED,
        }),
        permissionRepository: asClass(PermissionRepository, {
            lifetime: Lifetime.SCOPED,
        }),
        roleRepository: asClass(RoleRepository, {
            lifetime: Lifetime.SCOPED,
        }),
        logRepository: asClass(LogRepository, {
            lifetime: Lifetime.SCOPED,
        }),

        //Services
        authService: asClass(AuthService, {
            lifetime: Lifetime.SCOPED,
        }),
        hashService: asClass(HashService, {
            lifetime: Lifetime.SCOPED,
        }),
        tokenService: asClass(TokenService, {
            lifetime: Lifetime.SCOPED,
        }),
        userService: asClass(UserService, {
            lifetime: Lifetime.SCOPED,
        }),
        permissionService: asClass(PermissionService, {
            lifetime: Lifetime.SCOPED,
        }),
        roleService: asClass(RoleService, {
            lifetime: Lifetime.SCOPED,
        }),
        mailService: asClass(MailService, {
            lifetime: Lifetime.SCOPED,
        }),
        videoService: asClass(VideoService, {
            lifetime: Lifetime.SCOPED,
        }),
        courseService: asClass(CourseService, {
            lifetime: Lifetime.SCOPED,
        }),
        lessonService: asClass(LessonService, {
            lifetime: Lifetime.SCOPED,
        }),

        // Controllers
        authController: asClass(AuthController, {
            lifetime: Lifetime.SCOPED,
        }),

        userController: asClass(UserController, {
            lifetime: Lifetime.SCOPED,
        }),

        permissionController: asClass(PermissionController, {
            lifetime: Lifetime.SCOPED,
        }),

        roleController: asClass(RoleController, {
            lifetime: Lifetime.SCOPED,
        }),

        mailController: asClass(MailController, {
            lifetime: Lifetime.SCOPED,
        }),

        videoController: asClass(VideoController, {
            lifetime: Lifetime.SCOPED,
        }),

        courseController: asClass(CourseController, {
            lifetime: Lifetime.SCOPED,
        }),

        lessonController: asClass(LessonController, {
            lifetime: Lifetime.SCOPED,
        }),
    });

    return container;
}

export default container;