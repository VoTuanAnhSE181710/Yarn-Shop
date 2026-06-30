import mongoose from 'mongoose';
import Role from '../models/role.js';
import Permission from '../models/permission.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';

configDotenv();

const uri = configDB.uri;

/**
 * Assign ALL permissions to Admin role
 * Assign create + read + update permissions to Staff role
 * Assign read-only permissions (product-related) + create/read Order to Customer role
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

        // 1. Assign ALL permissions to Admin (full access)
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

        // 2. Assign to Staff: all CRUD permissions (including manage & delete) on operational resources, plus read-only on admin resources
        const staffPermissionIds = allPermissions
            .filter(p => {
                // Staff has manage & delete on operational resources (Kit, Course, Lesson, Product, Video, Category, DIYPost, Order)
                if (['Kit', 'Course', 'Lesson', 'Product', 'Video', 'Category', 'DIYPost', 'Order'].includes(p.resource)) {
                    return ['create', 'read', 'update', 'delete', 'manage'].includes(p.action);
                }
                // Staff can read User, Role, Permission, Log
                if (['User', 'Role', 'Permission', 'Log'].includes(p.resource)) {
                    return p.action === 'read';
                }
                // Staff can send emails
                if (p.resource === 'Mail') {
                    return p.action === 'create';
                }
                return false;
            })
            .map(p => p._id);

        const staffRole = await Role.findOneAndUpdate(
            { roleName: "Staff" },
            { permission: staffPermissionIds },
            { returnDocument: 'after' }
        );

        if (staffRole) {
            console.log(`✅ Staff role: assigned ${staffPermissionIds.length} permissions (manage + full CRUD on operational resources)`);
        } else {
            console.log('❌ Staff role not found');
        }

        // 3. Assign to Customer: read-only on browsing resources + create/read Order
        const customerPermissionIds = allPermissions
            .filter(p => {
                // Customer can read products, kits, courses, lessons, categories, DIY posts
                if (['Product', 'Kit', 'Course', 'Lesson', 'Category', 'DIYPost', 'Video'].includes(p.resource)) {
                    return p.action === 'read';
                }
                // Customer can create and read orders
                if (p.resource === 'Order') {
                    return ['create', 'read'].includes(p.action);
                }
                return false;
            })
            .map(p => p._id);

        const customerRole = await Role.findOneAndUpdate(
            { roleName: "Customer" },
            { permission: customerPermissionIds },
            { returnDocument: 'after' }
        );

        if (customerRole) {
            console.log(`✅ Customer role: assigned ${customerPermissionIds.length} permissions (read browsing + create/read order)`);
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