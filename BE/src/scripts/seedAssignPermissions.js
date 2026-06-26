import mongoose from 'mongoose';
import Role from '../models/role.js';
import Permission from '../models/permission.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';

configDotenv();

const uri = configDB.uri;

/**
 * Assign ALL permissions to Admin role
 * Assign read-only permissions to Staff role
 * Assign Order permissions to Customer role (create + read)
 * 
 * Usage: node src/scripts/seedAssignPermissions.js
 */
const seedAssignPermissions = async () => {
    try {
        await mongoose.connect(uri);
        console.log('📦 Connected to MongoDB');

        // Get all permissions
        const allPermissions = await Permission.find({});
        console.log(`📋 Found ${allPermissions.length} permissions`);

        if (allPermissions.length === 0) {
            console.log('❌ No permissions found. Run seedPermissions.js first.');
            process.exit(1);
        }

        const allPermissionIds = allPermissions.map(p => p._id);

        // 1. Assign ALL permissions to Admin
        const adminRole = await Role.findOneAndUpdate(
            { roleName: "Admin" },
            { permission: allPermissionIds },
            { returnDocument: 'after' }
        );

        if (adminRole) {
            console.log(`✅ Admin role: assigned ${allPermissionIds.length} permissions (full access)`);
        } else {
            console.log('❌ Admin role not found');
        }

        // 2. Assign read permissions to Staff
        const readPermissionIds = allPermissions
            .filter(p => p.action === 'read' || p.action === 'manage')
            .map(p => p._id);

        const staffRole = await Role.findOneAndUpdate(
            { roleName: "Staff" },
            { permission: readPermissionIds },
            { returnDocument: 'after' }
        );

        if (staffRole) {
            console.log(`✅ Staff role: assigned ${readPermissionIds.length} permissions (read + manage)`);
        } else {
            console.log('❌ Staff role not found');
        }

        // 3. Assign Create Order + Read Order to Customer (để đặt hàng & xem đơn)
        const customerOrderPermissionIds = allPermissions
            .filter(p => p.resource === 'Order' && (p.action === 'create' || p.action === 'read'))
            .map(p => p._id);

        const customerRole = await Role.findOneAndUpdate(
            { roleName: "Customer" },
            { permission: customerOrderPermissionIds },
            { returnDocument: 'after' }
        );

        if (customerRole) {
            console.log(`✅ Customer role: assigned ${customerOrderPermissionIds.length} permissions (Create Order + Read Order)`);
        } else {
            console.log('❌ Customer role not found');
        }

        await mongoose.connection.close();
        console.log('\n✨ Permission assignment completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedAssignPermissions();