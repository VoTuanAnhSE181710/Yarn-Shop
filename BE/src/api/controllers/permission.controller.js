export default class PermissionController {
    #permissionService;

    constructor({ permissionService }) {
        this.#permissionService = permissionService;
        this.createPermission = this.createPermission.bind(this);
        this.getAllPermissions = this.getAllPermissions.bind(this);
        this.getPermissionById = this.getPermissionById.bind(this);
        this.updatePermission = this.updatePermission.bind(this);
        this.deletePermission = this.deletePermission.bind(this);
        this.getAvailableResources = this.getAvailableResources.bind(this);
    }

    getAvailableResources = async (req, res, next) => {
        try {
            const result = await this.#permissionService.getAvailableResources();
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    createPermission = async (req, res, next) => {
        try {
            const permissionData = req.body;
            const newPermission = await this.#permissionService.createPermission({ permissionData });
            res.status(201).json({
                status: 'success',
                data: {
                    permission: newPermission,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    getAllPermissions = async (req, res, next) => {
        try {
            const filters = {
                name: req.query.name,
                resource: req.query.resource,
                action: req.query.action
            };
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };
            const result = await this.#permissionService.getAllPermissions({ filters, pagination });
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    getPermissionById = async (req, res, next) => {
        try {
            const { permissionId } = req.params;
            const permission = await this.#permissionService.getPermissionById({ permissionId });
            res.status(200).json({
                status: 'success',
                data: {
                    permission
                }
            });
        } catch (error) {
            next(error);
        }
    }

    updatePermission = async (req, res, next) => {
        try {
            const { permissionId } = req.params;
            const updateData = req.body;
            const updatedPermission = await this.#permissionService.updatePermission({ permissionId, updateData });
            res.status(200).json({
                status: 'success',
                data: {
                    permission: updatedPermission
                }
            });
        } catch (error) {
            next(error);
        }
    }

    deletePermission = async (req, res, next) => {
        try {
            const { permissionId } = req.params;
            await this.#permissionService.deletePermission({ permissionId });
            res.status(200).json({
                status: 'success',
                message: 'Permission deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    getStatistics = async (req, res, next) => {
        try {
            const result = await this.#permissionService.getStatistics();
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}