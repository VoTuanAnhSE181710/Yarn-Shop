import Permission from "../models/permission.js";

export default class PermissionRepository {
    async create(data){
        return Permission.create(data);
    }

    async findById(permissionId){
        return Permission.findById(permissionId);
    }

    async findByName(name){
        return Permission.findOne({ name });
    }

    async findByResourceAndAction(resource, action){
        return Permission.findOne({ resource, action });
    }
    
    async update(permissionId, updateData){
        return Permission.findByIdAndUpdate(permissionId, updateData, { returnDocument: 'after' });
    }

    async getAll(filters = {}, pagination = {}){
        const query = {};
        if (filters.name) {
            query.name = { $regex: filters.name, $options: 'i' };
        }
        if (filters.resource) {
            query.resource = { $regex: filters.resource, $options: 'i' };
        }
        if (filters.action) {
            query.action = filters.action;
        }
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Permission.find(query).skip(skip).limit(limit),
            Permission.countDocuments(query)
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getStatistics() {
        const [totalPermissions, permissionsByResource, permissionsByAction] = await Promise.all([
            Permission.countDocuments(),
            Permission.aggregate([
                {
                    $group: {
                        _id: '$resource',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                {
                    $project: {
                        resource: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            ]),
            Permission.aggregate([
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                {
                    $project: {
                        action: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            ])
        ]);

        return {
            totalPermissions,
            permissionsByResource,
            permissionsByAction
        };
    }

    async delete(permissionId){
        return Permission.findByIdAndDelete(permissionId);
    }
}