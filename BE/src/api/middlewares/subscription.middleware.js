import { ForbiddenError, BadRequestError } from "../../error/error.js";
import { User } from "../../models/Model.js";

/**
 * Middleware to check if user has required subscription level
 * Fetches user from DB to get current subscription status
 * @param {"Freemium"|"Premium"} requiredSubscription
 */
export const requireSubscription = (requiredSubscription) => async (req, res, next) => {
    try {
        const user = req.user;

        if (!user || !user.userId) {
            throw new BadRequestError("User not authenticated");
        }

        // Fetch user from DB to get current subscription status
        const userData = await User.findById(user.userId)
            .populate("role")
            .lean();

        if (!userData) {
            throw new BadRequestError("User not found");
        }

        // Staff and Admin always have access to all content
        if (userData.role?.roleName === "Staff" || userData.role?.roleName === "Admin") {
            req.user.subscription = "Premium";
            return next();
        }

        if (userData.subscription !== requiredSubscription) {
            throw new ForbiddenError(
                `${requiredSubscription} subscription required to access this content`
            );
        }

        // Attach subscription info to req for downstream use
        req.user.subscription = userData.subscription;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware to check if user can create a video of a certain type
 * - "community": Freemium, Premium, Staff all can create
 * - "premium": Only Staff can create
 */
export const requireCanCreateVideoType = () => async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { type } = req.body;

        if (!type) {
            return next(); // Will be caught by validator
        }

        if (type === "community") {
            // All authenticated users can create community videos
            return next();
        }

        if (type === "premium") {
            // Only Staff can create premium videos
            const userData = await User.findById(userId)
                .populate("role")
                .lean();

            if (!userData || !userData.role) {
                throw new ForbiddenError("User role not found");
            }

            if (userData.role.roleName !== "Staff") {
                throw new ForbiddenError("Only Staff can create premium videos");
            }

            return next();
        }

        next();
    } catch (error) {
        next(error);
    }
}