import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from "../error/error.js";
import { ACTIONS, TARGET_TYPES, OUTCOMES } from "../constants/constants.js";

export default class RoleService {
    #roleRepository;
    #permissionRepository;
    #logRepository;

    constructor({ roleRepository, permissionRepository, logRepository }) {
        this.#roleRepository = roleRepository;
        this.#permissionRepository = permissionRepository;
        this.#logRepository = logRepository;
    }

    async createRole(adminUser, payload){
        const{ name, permissions, description, isActive } = payload;

        //auth check
        if(!adminUser || !adminUser.userId){
            throw new ForbiddenError('User authentication is required.');
        }

        if(adminUser.roleName !== 'Admin'){
            throw new ForbiddenError('Access denied. Only Admins can create roles.');
        }

        if(permissions && permissions.length > 0){
            for(const permissionId of permissions){
                const permission = await this.#permissionRepository.findById(permissionId);
                if(!permission){
                    throw new BadRequestError(`Permission with ID '${permissionId}' does not exist.`);
                }
            }
        }

        const newRole = await this.#roleRepository.create({
            roleName: name,
            permission: permissions || [],
            description,
            isActive: isActive !== undefined ? isActive : true
        });

        await this.#logRepository.saveLog({
            action: ACTIONS.CREATE,
            targetType: TARGET_TYPES.ROLE,
            outcome: OUTCOMES.SUCCESS,
            actorId: adminUser?.userId || null,
            details: {
                roleId: newRole._id.toString(),
                roleName: newRole.roleName,
                permissionsCount: permissions?.length || 0,
            },
        });

        return {
            message: 'Role created successfully.',
            data: newRole
        }
    }

    async getAllRoles({name = null, isActive = null, page = 1, limit = 10}){
        const filter = {};
        if(name){
            filter.roleName = { $regex: name, $options: 'i' };
        }
        if(isActive !== null){
            filter.isActive = isActive;
        }
        const roles = await this.#roleRepository.findAll({ filter, page, limit });
        return {
            message: 'Roles retrieved successfully.',
            data: roles
        }
    }

    async getRoleById(roleId){
        const role = await this.#roleRepository.findById(roleId);
        if(!role){
            throw new NotFoundError('Role not found');
        }
        return {
            message: 'Role retrieved successfully.',
            data: role
        }
    }

    async updateRole(roleID, updateData, userID){
        if(!userID){
            throw new ForbiddenError('User authentication is required.');
        }

        const role = await this.#roleRepository.findById(roleID);
        if(!role){
            throw new NotFoundError('Role not found');
        }

        if (updateData.permissions && updateData.permissions.length > 0) {
            for (const permissionId of updateData.permissions) {
                const permission = await this.#permissionRepository.findById(permissionId);
                if (!permission) {
                    throw new BadRequestError(`Permission with ID '${permissionId}' does not exist.`);
                }
            }
        }

        const updatedRole = await this.#roleRepository.update(roleID, {
            ...(updateData.name && { roleName: updateData.name }),
            ...(updateData.description !== undefined && { description: updateData.description }),
            ...(updateData.permissions && { permission: updateData.permissions }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        });

        await this.#logRepository.saveLog({
            action: ACTIONS.UPDATE,
            targetType: TARGET_TYPES.ROLE,
            outcome: OUTCOMES.SUCCESS,
            actorId: userID,
            details: {
                roleId: roleID,
                roleName: role.roleName,
                updatedFields: Object.keys(updateData),
            },
        });
        
        return {
            message: 'Role updated successfully.',
            data: updatedRole
        };
    }

    async deleteRole(roleId, userId){
        if(!userId){
            throw new ForbiddenError('User authentication is required.');
        }

        const role = await this.#roleRepository.findById(roleId);
        if(!role){
            throw new NotFoundError('Role not found');
        }
        
        const userCount = await this.#roleRepository.countUsersWithRole(roleId);
        if(userCount > 0){
            throw new ConflictError('Cannot delete role that is assigned to users. Please reassign or remove users from this role before deletion.');
        }
        await this.#roleRepository.softDelete(roleId);

        await this.#logRepository.saveLog({
            action: ACTIONS.DELETE,
            targetType: TARGET_TYPES.ROLE,
            outcome: OUTCOMES.SUCCESS,
            actorId: userId,
            details: {
                roleId: roleId,
                roleName: role.roleName,
            },
        });

        return {
            message: 'Role deleted successfully.'
        };
    }

    async getStatistics() {
        const statistics = await this.#roleRepository.getStatistics();
        return {
            message: 'Role statistics retrieved successfully.',
            data: statistics
        };
    }
}