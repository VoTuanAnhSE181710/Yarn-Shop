import Role from '../models/role.js';
import User from '../models/user.js';
import Permission from '../models/permission.js';

export default class RoleRepository {
    async findById(roleId){
        return Role.findById(roleId);
    }

    async findByRoleName({ roleName }){
        return Role.findOne({ roleName });
    }

    async create(data){
        if (data.permission && data.permission.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: data.permission } });

            if (validPermissions.length !== data.permission.length) {
                throw new Error('One or more permissions are invalid');
            }
        }
        return Role.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10}){
        const skip = (page - 1) * limit;

        const roles = await Role.find(filter)
            .sort({ roleName: 1})
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await Role.countDocuments(filter);

        return {
            roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async countUsersWithRole(roleId){
        return User.countDocuments({ roleId: roleId });
    }

    async update(roleId, updateData){
        if (updateData.permission && updateData.permission.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: updateData.permission } });

            if (validPermissions.length !== updateData.permission.length) {
                throw new Error('One or more permissions are invalid');
            }
        }

        return Role.findByIdAndUpdate(roleId, updateData, { returnDocument: 'after' });
    }

    async softDelete(roleId){
        return Role.findByIdAndUpdate(roleId, { isActive: false }, { returnDocument: 'after' });
    }

    async getStatistics() {
        const [totalRoles, activeRoles, inactiveRoles, rolesWithPermissionCount, usersGroupedByRole] = await Promise.all([
            Role.countDocuments(),
            Role.countDocuments({ isActive: true }),
            Role.countDocuments({ isActive: false }),
            Role.aggregate([
                {
                    $project: {
                        roleName: 1,
                        permissionCount: { $size: '$permission' },
                        isActive: 1
                    }
                },
                { $sort: { permissionCount: -1 } }
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: '$roleId',
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'roles',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'roleInfo'
                    }
                },
                { $unwind: '$roleInfo' },
                {
                    $project: {
                        roleName: '$roleInfo.roleName',
                        userCount: '$count'
                    }
                },
                { $sort: { userCount: -1 } }
            ])
        ]);

        return {
            totalRoles,
            activeRoles,
            inactiveRoles,
            rolesWithPermissionCount,
            usersGroupedByRole
        };
    }
}