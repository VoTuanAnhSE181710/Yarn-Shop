class CustomerController {
    #authService;
    #userService;
    #customerService;

    constructor({ authService, userService, customerService }) {
        this.#authService = authService;
        this.#userService = userService;
        this.#customerService = customerService;
    }

    // POST /api/customers/register
    register = async (req, res, next) => {
        try {
            const { fullName, email, phone, password } = req.body;

            const result = await this.#authService.publicRegister({
                username: email,
                email,
                password,
                phone,
                fullName,
            });

            res.status(201).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // POST /api/customers/login
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const deviceName = req.headers["user-agent"] || "unknown";

            const result = await this.#authService.login({
                email,
                password,
                deviceName,
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // GET /api/customers/me
    getMe = async (req, res, next) => {
        try {
            const { userId } = req.user;

            const userProfile = await this.#userService.getMyProfile({ userId });

            res.status(200).json({
                status: "success",
                data: userProfile,
            });
        } catch (error) {
            next(error);
        }
    };

    // PUT /api/customers/me
    updateMe = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { fullName, phone, address, avatarUrl } = req.body;

            const updatedUser = await this.#customerService.updateMyProfile({
                userId,
                fullName,
                phone,
                address,
                avatarUrl,
            });

            res.status(200).json({
                status: "success",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    };

    // PUT /api/customers/me/password
    changePassword = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { oldPassword, newPassword } = req.body;

            const result = await this.#customerService.changeMyPassword({
                userId,
                oldPassword,
                newPassword,
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // GET /api/admin/customers
    adminGetAll = async (req, res, next) => {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const result = await this.#userService.getAllUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // GET /api/admin/customers/:id
    adminGetById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await this.#userService.getUserById({ queryUserId: id });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // PUT /api/admin/customers/:id
    adminUpdate = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { id } = req.params;
            const userData = req.body;

            const result = await this.#userService.updateUserData({
                queryUserId: id,
                userData,
                userId,
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // DELETE /api/admin/customers/:id
    adminDelete = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            const result = await this.#userService.softDeleteUser({
                queryUserId: id,
                userId,
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}

export default CustomerController;