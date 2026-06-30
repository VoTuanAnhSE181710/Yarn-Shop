import {
  BadRequestError,
  ForbiddenError,
  AuthorizationError,
  TokenMissing,
  AuthenticationError,
} from "../../error/error.js";
import { Role } from "../../models/Model.js";

export const authentication = (req, res, next) => {
  try {
    const requestHeader = req.headers.authorization;

    if (!requestHeader) {
      throw new AuthorizationError("Header is not containing information");
    }

    // Expect format: "Bearer <token>"
    const parts = requestHeader.split(" ");
    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      throw new TokenMissing("Missing token from header");
    }

    const accessToken = parts[1];

    const tokenService = req.container.resolve("tokenService");

    let decode;
    try {
      decode = tokenService.verifyAccessToken({ token: accessToken });
    } catch (jwtError) {
      // jsonwebtoken throws TokenExpiredError / JsonWebTokenError / NotBeforeError
      if (jwtError && jwtError.name === "TokenExpiredError") {
        throw new AuthenticationError("Access Token is expired!");
      }
      throw new AuthenticationError("Access Token is invalid!");
    }

    if (!decode) {
      throw new AuthenticationError("Access Token is expired!");
    }

    req.user = decode;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizationByRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.roleName)) {
    return next(new ForbiddenError());
  }
  next();
};

export const handleError = (err, req, res, next) => {
  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(" and ");
    return res.status(409).json({
      status: "error",
      message: `Duplicate value for ${field}. This combination already exists.`,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Server error";
  const status = statusCode !== 500 ? "error" : "fail";

  res.status(statusCode).json({
    status: status,
    message: message,
  });
};

export const validateData =
  (schema, property = "body") =>
  (req, res, next) => {
    const dataNeedToValidate = req[property];

    // Cho phép query params và params rỗng, nhưng body phải có data
    if (!dataNeedToValidate && property === "body") {
      throw new BadRequestError(`Missing ${property} in request!`);
    }

    // Nếu không có data nhưng không phải body thì validate với object rỗng
    const { error } = schema.validate(dataNeedToValidate || {});

    if (error) {
      const errorMessage = error.details[0].message;
      throw new BadRequestError(errorMessage);
    }

    next();
  };

export const verifyDevice = async (req, res, next) => {
  try {
    const { userId, deviceId } = req.user;

    if (!userId || !deviceId) {
      throw new BadRequestError(`Missing token from header`);
    }

    const tokenService = req.container.resolve("tokenService");
    const isValidDevice = await tokenService.verifyDeviceId({
      userId,
      deviceId,
    });

    if (isValidDevice !== 1) {
      throw new BadRequestError(`Wrong device detected`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkPermission = (resource, action) => async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.roleId) {
      throw new ForbiddenError("User does not have a valid role.");
    }

    //populate role voi permission
    const role = await Role.findById(user.roleId).populate("permission");

    if (!role) {
      throw new ForbiddenError("User's role not found.");
    }

    //check neu role co permission nay
    // "manage" action grants access to all CRUD operations
    const hasPermission = role.permission.some(
      (permission) =>
        permission.resource === resource &&
        (permission.action === action || permission.action === "manage"),
    );
    if (!hasPermission) {
      throw new ForbiddenError(
        "User does not have permission to perform this action.",
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
