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

        // Assign ALL permissions to Admin
        const adminRole = await Role.findOneAndUpdate(
            { roleName: "Admin" },
            { permission: allPermissionIds },
            { new: true }
        );

        if (adminRole) {
            console.log(`✅ Admin role: assigned ${allPermissionIds.length} permissions`);
        } else {
            console.log('❌ Admin role not found');
        }

        // Assign read permissions to Staff
        const readPermissionIds = allPermissions
            .filter(p => p.action === 'read' || p.action === 'manage')
            .map(p => p._id);

        const staffRole = await Role.findOneAndUpdate(
            { roleName: "Staff" },
            { permission: readPermissionIds },
            { new: true }
        );

        if (staffRole) {
            console.log(`✅ Staff role: assigned ${readPermissionIds.length} permissions`);
        } else {
            console.log('❌ Staff role not found');
        }

        // Customer gets no special permissions
        console.log('ℹ️  Customer role: no permissions assigned (public access only)');

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