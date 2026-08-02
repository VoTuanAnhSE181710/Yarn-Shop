import { createContainer, asClass, asValue, Lifetime } from "awilix";

//import Models
import { Role, Permission, User, Message, Conversation, Log } from "./src/models/Model.js";

//import Controller
import AuthController from "./src/api/controllers/auth.controller.js";
import UserController from "./src/api/controllers/user.controller.js";
import PermissionController from "./src/api/controllers/permission.controller.js";
import CartController from "./src/api/controllers/cart.controller.js";
import RoleController from "./src/api/controllers/role.controller.js";
import MailController from "./src/api/controllers/mail.controller.js";
import VideoController from "./src/api/controllers/video.controller.js";
import KitController from "./src/api/controllers/kit.controller.js";
import CustomerController from "./src/api/controllers/customer.controller.js";
import CourseController from "./src/api/controllers/course.controller.js";
import LessonController from "./src/api/controllers/lesson.controller.js";
import OrderController from "./src/api/controllers/order.controller.js";
import ProductController from "./src/api/controllers/product.controller.js";
import DIYPostController from "./src/api/controllers/diyPost.controller.js";
import OrderReportController from "./src/api/controllers/orderReport.controller.js";
import SupportDIYController from "./src/api/controllers/supportDIY.controller.js";
import AddressController from "./src/api/controllers/address.controller.js";
import RefundInvoiceController from "./src/api/controllers/refundInvoice.controller.js";
import NotificationController from "./src/api/controllers/notification.controller.js";
import MessageController from "./src/api/controllers/message.controller.js";
import LogController from "./src/api/controllers/log.controller.js";
import ShippingController from "./src/api/controllers/shipping.controller.js";
import ChatbotController from "./src/api/controllers/chatbot.controller.js";
import AiAgentController from "./src/modules/ai-agent/aiAgent.controller.js";

//import Service
import AuthService from "./src/services/auth.service.js";
import HashService from "./src/services/hash.service.js";
import TokenService from "./src/services/token.service.js";
import UserService from "./src/services/user.service.js";
import PermissionService from "./src/services/permission.service.js";
import RoleService from "./src/services/role.service.js";
import MailService from "./src/services/mail.service.js";
import VideoService from "./src/services/video.service.js";
import KitService from "./src/services/kit.service.js";
import CustomerService from "./src/services/customer.service.js";
import CourseService from "./src/services/course.service.js";
import LessonService from "./src/services/lesson.service.js";
import OrderService from "./src/services/order.service.js";
import ProductService from "./src/services/product.service.js";
import DIYPostService from "./src/services/diyPost.service.js";
import OrderReportService from "./src/services/orderReport.service.js";
import CartService from "./src/services/cart.service.js";
import SupportDIYService from "./src/services/supportDIY.service.js";
import AddressService from "./src/services/address.service.js";
import GHNService from "./src/services/ghn.service.js";
import RefundInvoiceService from "./src/services/refundInvoice.service.js";
import NotificationService from "./src/services/notification.service.js";
import MessageService from "./src/services/message.service.js";
import LogService from "./src/services/log.service.js";
import GeocodingService from "./src/services/geocoding.service.js";
import ShippingService from "./src/services/shipping.service.js";
import ChatbotService from "./src/services/chatbot.service.js";
import AiAgentService from "./src/modules/ai-agent/aiAgent.service.js";
import AgentToolRegistry from "./src/modules/ai-agent/tools/agentToolRegistry.js";
import GeminiPlanner from "./src/modules/ai-agent/providers/geminiPlanner.js";

//import Repositories
import RefreshTokenRepository from "./src/repositories/refreshToken.repository.js";
import UserRepository from "./src/repositories/user.repository.js";
import PermissionRepository from "./src/repositories/permission.repository.js";
import RoleRepository from "./src/repositories/role.repository.js";
import CartRepository from "./src/repositories/cart.repository.js";
import LogRepository from "./src/repositories/log.repository.js";
import KitRepository from "./src/repositories/kit.repository.js";
import OrderRepository from "./src/repositories/order.repository.js";
import ProductRepository from "./src/repositories/product.repository.js";
import DIYPostRepository from "./src/repositories/diyPost.repository.js";
import OrderReportRepository from "./src/repositories/orderReport.repository.js";
import SupportDIYRepository from "./src/repositories/supportDIY.repository.js";
import AddressRepository from "./src/repositories/address.repository.js";
import MessageRepository from "./src/repositories/message.repository.js";
import ConversationRepository from "./src/repositories/conversation.repository.js";
import ShopLocationRepository from "./src/repositories/shopLocation.repository.js";
import ChatbotRepository from "./src/repositories/chatbot.repository.js";
import AiAgentRepository from "./src/modules/ai-agent/aiAgent.repository.js";

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

    Message: asValue(Message),
    Conversation: asValue(Conversation),
    Log: asValue(Log),

    //Repositories
    refreshTokenRepository: asClass(RefreshTokenRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    cartRepository: asClass(CartRepository, {
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
    kitRepository: asClass(KitRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    orderRepository: asClass(OrderRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    productRepository: asClass(ProductRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    diyPostRepository: asClass(DIYPostRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    orderReportRepository: asClass(OrderReportRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    supportDIYRepository: asClass(SupportDIYRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    addressRepository: asClass(AddressRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    messageRepository: asClass(MessageRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    conversationRepository: asClass(ConversationRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    shopLocationRepository: asClass(ShopLocationRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    chatbotRepository: asClass(ChatbotRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    aiAgentRepository: asClass(AiAgentRepository, {
      lifetime: Lifetime.SCOPED,
    }),

    //Services
    cartService: asClass(CartService, {
      lifetime: Lifetime.SCOPED,
    }),
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
    kitService: asClass(KitService, {
      lifetime: Lifetime.SCOPED,
    }),
    customerService: asClass(CustomerService, {
      lifetime: Lifetime.SCOPED,
    }),
    courseService: asClass(CourseService, {
      lifetime: Lifetime.SCOPED,
      injectionMode: 'PROXY'
    }),
    lessonService: asClass(LessonService, {
      lifetime: Lifetime.SCOPED,
    }),
    orderService: asClass(OrderService, {
      lifetime: Lifetime.SCOPED,
    }),
    productService: asClass(ProductService, {
      lifetime: Lifetime.SCOPED,
    }),
    diyPostService: asClass(DIYPostService, {
      lifetime: Lifetime.SCOPED,
    }),
    orderReportService: asClass(OrderReportService, {
      lifetime: Lifetime.SCOPED,
    }),
    ghnService: asClass(GHNService, {
      lifetime: Lifetime.SCOPED,
    }),
    supportDIYService: asClass(SupportDIYService, {
      lifetime: Lifetime.SCOPED,
    }),
    addressService: asClass(AddressService, {
      lifetime: Lifetime.SCOPED,
    }),
    refundInvoiceService: asClass(RefundInvoiceService, {
      lifetime: Lifetime.SCOPED,
    }),
    notificationService: asClass(NotificationService, {
      lifetime: Lifetime.SCOPED,
    }),
    messageService: asClass(MessageService, {
      lifetime: Lifetime.SCOPED,
    }),
    logService: asClass(LogService, {
      lifetime: Lifetime.SCOPED,
    }),
    geocodingService: asClass(GeocodingService, {
      lifetime: Lifetime.SCOPED,
    }),
    shippingService: asClass(ShippingService, {
      lifetime: Lifetime.SCOPED,
    }),
    chatbotService: asClass(ChatbotService, {
      lifetime: Lifetime.SCOPED,
    }),
    geminiPlanner: asClass(GeminiPlanner, {
      lifetime: Lifetime.SCOPED,
    }),
    agentToolRegistry: asClass(AgentToolRegistry, {
      lifetime: Lifetime.SCOPED,
    }),
    aiAgentService: asClass(AiAgentService, {
      lifetime: Lifetime.SCOPED,
    }),

    // Controllers
    cartController: asClass(CartController, {
      lifetime: Lifetime.SCOPED,
    }),
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

    kitController: asClass(KitController, {
      lifetime: Lifetime.SCOPED,
    }),
    customerController: asClass(CustomerController, {
      lifetime: Lifetime.SCOPED,
    }),

    courseController: asClass(CourseController, {
      lifetime: Lifetime.SCOPED,
    }),

    lessonController: asClass(LessonController, {
      lifetime: Lifetime.SCOPED,
    }),

    orderController: asClass(OrderController, {
      lifetime: Lifetime.SCOPED,
    }),
    productController: asClass(ProductController, {
      lifetime: Lifetime.SCOPED,
    }),
    diyPostController: asClass(DIYPostController, {
      lifetime: Lifetime.SCOPED,
    }),
    orderReportController: asClass(OrderReportController, {
      lifetime: Lifetime.SCOPED,
    }),
    supportDIYController: asClass(SupportDIYController, {
      lifetime: Lifetime.SCOPED,
    }),
    addressController: asClass(AddressController, {
      lifetime: Lifetime.SCOPED,
    }),
    refundInvoiceController: asClass(RefundInvoiceController, {
      lifetime: Lifetime.SCOPED,
    }),
    notificationController: asClass(NotificationController, {
      lifetime: Lifetime.SCOPED,
    }),
    messageController: asClass(MessageController, {
      lifetime: Lifetime.SCOPED,
    }),
    logController: asClass(LogController, {
      lifetime: Lifetime.SCOPED,
    }),
    shippingController: asClass(ShippingController, {
      lifetime: Lifetime.SCOPED,
    }),
    chatbotController: asClass(ChatbotController, {
      lifetime: Lifetime.SCOPED,
    }),
    aiAgentController: asClass(AiAgentController, {
      lifetime: Lifetime.SCOPED,
    }),
  });

  return container;
}

export default container;
