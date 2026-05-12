export default class RoleController {
    #roleService;
   
    constructor({ roleService }) {
        this.#roleService = roleService;
        this.createRole = this.createRole.bind(this);
    }

    createRole = async (req, res, next) => {
        try{
            const result = await this.#roleService.createRole(req.user, req.body);
            res.status(201).json({
                status: 'success',
                data: {
                    role: result,
                }
            })
        } catch(error){
            next(error);
        }
    }

    getAllRoles = async (req, res, next) => {
        try {
            const { name, isActive, page, limit } = req.query;
            const result = await this.#roleService.getAllRoles({ name, isActive, page, limit });
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch(error){
            next(error);
        }
    }

    getRoleById = async (req, res, next) => {
        try {
            const result = await this.#roleService.getRoleById(req.params.roleId);
            res.status(200).json({
                status: 'success',
                data: {
                    role: result
                }
            });
        } catch (error){
            next(error);
        }
    }

    updateRole = async (req, res, next) => {
        try {
            const result = await this.#roleService.updateRole(req.params.roleId, req.body, req.user.userId);
            res.status(200).json({
                status: 'success',
                data: {
                    role: result
                }
            });
        } catch (error){
            next(error);
        }
    }

    deleteRole = async (req, res, next) => {
        try {
            const result = await this.#roleService.deleteRole(req.params.roleId, req.user.userId);
            res.status(200).json({
                status: 'success',
                data: {
                    role: result
                }
            });
        } catch (error){
            next(error);
        }
    }

    getStatistics = async (req, res, next) => {
        try {
            const result = await this.#roleService.getStatistics();
            res.status(200).json({
                status: 'success',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}
