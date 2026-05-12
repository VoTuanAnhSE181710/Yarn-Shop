import { BadRequestError, NotFoundError } from "../error/error.js";

class PermissionService {
    #permissionRepository

    constructor({
        permissionRepository
    }) {
        this.#permissionRepository = permissionRepository;
    }

    getAvailableResources = async () => {
        const resources = [
            "User",
            "Warehouse",
            "Role",
            "Permission",
            "Equipment",
            "Instrument",
            "InventoryItem",
            "MaintenanceHistory",
            "Incident",
            "Log",
            "MaintenanceSchedule",
            "Engineer",
            "OilOutput"
        ];

        const actions = ["create", "read", "update", "delete", "manage", "assign", "receive", "dispatch", "unassign"];

        return {
            resources,
            actions
        };
    }

    createPermission = async ({ permissionData }) => {
        const { name, resource, action, description } = permissionData;
        const existingPermission = await this.#permissionRepository.findByResourceAndAction(resource, action);

        if(existingPermission) {
            throw new BadRequestError(`Permission with resource '${resource}' and action '${action}' already exists.`);
        }

        const newPermission = await this.#permissionRepository.create({
            name,
            resource,
            action,
            description
        });
        return newPermission;
    }

    getAllPermissions = async ({ filters, pagination }) => {
        const result = await this.#permissionRepository.getAll(filters, pagination);
        return result;
    }

    getPermissionById = async ({ permissionId }) => {
        const permission = await this.#permissionRepository.findById(permissionId);
        if (!permission) {
            throw new NotFoundError('Permission not found');
        }
        return permission;
    }

    updatePermission = async ({ permissionId, updateData }) => {
        const permission = await this.#permissionRepository.findById(permissionId);
        if (!permission) {
            throw new NotFoundError('Permission not found');
        }

        // Check nếu update resource và action thì phải unique
        if (updateData.resource || updateData.action) {
            const resource = updateData.resource || permission.resource;
            const action = updateData.action || permission.action;
            
            const existingPermission = await this.#permissionRepository.findByResourceAndAction(resource, action);
            if (existingPermission && existingPermission._id.toString() !== permissionId) {
                throw new BadRequestError(`Permission with resource '${resource}' and action '${action}' already exists.`);
            }
        }

        const updatedPermission = await this.#permissionRepository.update(permissionId, updateData);
        return updatedPermission;
    }

    deletePermission = async ({ permissionId }) => {
        const permission = await this.#permissionRepository.findById(permissionId);
        if (!permission) {
            throw new NotFoundError('Permission not found');
        }
        await this.#permissionRepository.delete(permissionId);
    }

    getStatistics = async () => {
        const statistics = await this.#permissionRepository.getStatistics();
        return statistics;
    }
}

export default PermissionService;