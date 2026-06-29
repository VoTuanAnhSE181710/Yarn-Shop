import mongoose from 'mongoose';
import Permission from '../models/permission.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';

configDotenv();

const uri = configDB.uri;

/**
 * Seed Permissions - Thêm các permissions cho các chức năng trong hệ thống
 * 
 * Lưu ý: Script này không xóa permissions cũ, chỉ thêm mới các permissions chưa có
 * 
 * Usage: node src/scripts/seedPermissions.js
 */
const seedPermissions = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(uri);
        console.log('📦 Connected to MongoDB');

        // Danh sách permissions cần thêm (loại trừ manage và Update User)
        const permissions = [
            // ===== USER PERMISSIONS =====
            {
                name: "Create User",
                resource: "User",
                action: "create",
                description: "Permission to register/create new users"
            },
            {
                name: "Read User",
                resource: "User",
                action: "read",
                description: "Permission to view user information and list all users"
            },
            {
                name: "Delete User",
                resource: "User",
                action: "delete",
                description: "Permission to soft delete users"
            },

            // ===== ROLE PERMISSIONS =====
            {
                name: "Create Role",
                resource: "Role",
                action: "create",
                description: "Permission to create new roles"
            },
            {
                name: "Read Role",
                resource: "Role",
                action: "read",
                description: "Permission to view role information and list all roles"
            },
            {
                name: "Update Role",
                resource: "Role",
                action: "update",
                description: "Permission to update role information and permissions"
            },
            {
                name: "Delete Role",
                resource: "Role",
                action: "delete",
                description: "Permission to delete roles"
            },

            // ===== PERMISSION PERMISSIONS =====
            {
                name: "Create Permission",
                resource: "Permission",
                action: "create",
                description: "Permission to create new permissions"
            },
            {
                name: "Read Permission",
                resource: "Permission",
                action: "read",
                description: "Permission to view permissions and available resources"
            },
            {
                name: "Update Permission",
                resource: "Permission",
                action: "update",
                description: "Permission to update permission information"
            },
            {
                name: "Delete Permission",
                resource: "Permission",
                action: "delete",
                description: "Permission to delete permissions"
            },

            // ===== ORDER PERMISSIONS =====
            {
                name: "Create Order",
                resource: "Order",
                action: "create",
                description: "Permission to create new orders"
            },
            {
                name: "Read Order",
                resource: "Order",
                action: "read",
                description: "Permission to view order information and list all orders"
            },
            {
                name: "Update Order",
                resource: "Order",
                action: "update",
                description: "Permission to update order information and status"
            },
            {
                name: "Delete Order",
                resource: "Order",
                action: "delete",
                description: "Permission to delete/cancel orders"
            },

            // ===== LOG PERMISSIONS =====
            {
                name: "Read Log",
                resource: "Log",
                action: "read",
                description: "Permission to view system logs"
            },

            // ===== MAIL PERMISSIONS =====
            {
                name: "Create Mail",
                resource: "Mail",
                action: "create",
                description: "Permission to send OTP and verification emails"
            },
            {
                name: "Read Mail",
                resource: "Mail",
                action: "read",
                description: "Permission to verify OTP codes"
            },

            // ===== VIDEO PERMISSIONS =====
            {
                name: "Create Video",
                resource: "Video",
                action: "create",
                description: "Permission to upload/create new videos"
            },
            {
                name: "Read Video",
                resource: "Video",
                action: "read",
                description: "Permission to view video information and list videos"
            },
            {
                name: "Update Video",
                resource: "Video",
                action: "update",
                description: "Permission to update video metadata"
            },
            {
                name: "Delete Video",
                resource: "Video",
                action: "delete",
                description: "Permission to delete videos"
            },
            {
                name: "Manage Video",
                resource: "Video",
                action: "manage",
                description: "Full management access to all videos (Admin/Staff)"
            }
        ];

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log(`\n🔄 Starting to seed ${permissions.length} permissions...\n`);

        for (const permData of permissions) {
            try {
                // Kiểm tra xem permission đã tồn tại chưa
                const existing = await Permission.findOne({ 
                    name: permData.name 
                });

                if (existing) {
                    console.log(`⏭️  Skipped: "${permData.name}" - already exists`);
                    skippedCount++;
                } else {
                    await Permission.create(permData);
                    console.log(`✅ Created: "${permData.name}"`);
                    createdCount++;
                }
            } catch (error) {
                console.error(`❌ Error creating "${permData.name}":`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(60));
        console.log(`✅ Created:  ${createdCount} permissions`);
        console.log(`⏭️  Skipped:  ${skippedCount} permissions (already exist)`);
        console.log(`❌ Errors:   ${errorCount} permissions`);
        console.log(`📋 Total:    ${permissions.length} permissions processed`);
        console.log('='.repeat(60));

        // Đóng kết nối
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        console.log('🎉 Permission seeding completed!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

// Chạy seed
seedPermissions();