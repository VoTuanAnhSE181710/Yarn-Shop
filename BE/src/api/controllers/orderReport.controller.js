export default class OrderReportController {
    constructor({ orderReportService }) {
        this.orderReportService = orderReportService;
    }

    // ── Customer endpoints ──

    create = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const report = await this.orderReportService.createReport(req.body, userId);
            res.status(201).json({
                status: 'success',
                message: 'Report created successfully',
                data: report,
            });
        } catch (error) {
            next(error);
        }
    };

    getMyReports = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const result = await this.orderReportService.getMyReports(userId, req.query);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const isAdmin = req.user.roleName === "Admin" || req.user.roleName === "Staff";
            const report = await this.orderReportService.getReportById(req.params.id, userId, isAdmin);
            res.status(200).json({
                status: 'success',
                data: { report },
            });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const report = await this.orderReportService.updateReport(req.params.id, req.body, userId);
            res.status(200).json({
                status: 'success',
                message: 'Report updated successfully',
                data: { report },
            });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            await this.orderReportService.deleteReport(req.params.id, userId);
            res.status(200).json({
                status: 'success',
                message: 'Report deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    // ── Admin endpoints ──

    getAll = async (req, res, next) => {
        try {
            const result = await this.orderReportService.getAllReports(req.query);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req, res, next) => {
        try {
            const { status, adminNote } = req.body;
            if (!status || !["DONE", "CANCELLED"].includes(status)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Status must be DONE or CANCELLED',
                });
            }
            const report = await this.orderReportService.updateStatus(req.params.id, status, adminNote);
            res.status(200).json({
                status: 'success',
                message: 'Report status updated successfully',
                data: { report },
            });
        } catch (error) {
            next(error);
        }
    };

    assignStaff = async (req, res, next) => {
        try {
            const { assignedStaff } = req.body;
            if (!assignedStaff) {
                return res.status(400).json({
                    status: 'error',
                    message: 'assignedStaff is required',
                });
            }
            const report = await this.orderReportService.assignStaff(req.params.id, assignedStaff);
            res.status(200).json({
                status: 'success',
                message: 'Staff assigned successfully',
                data: { report },
            });
        } catch (error) {
            next(error);
        }
    };

    updateAdminNote = async (req, res, next) => {
        try {
            const { adminNote } = req.body;
            if (adminNote === undefined) {
                return res.status(400).json({
                    status: 'error',
                    message: 'adminNote is required',
                });
            }
            const report = await this.orderReportService.updateAdminNote(req.params.id, adminNote);
            res.status(200).json({
                status: 'success',
                message: 'Admin note updated successfully',
                data: { report },
            });
        } catch (error) {
            next(error);
        }
    };

    adminDelete = async (req, res, next) => {
        try {
            await this.orderReportService.adminDeleteReport(req.params.id);
            res.status(200).json({
                status: 'success',
                message: 'Report deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };
}