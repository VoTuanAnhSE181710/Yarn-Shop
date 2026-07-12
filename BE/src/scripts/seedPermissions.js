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

        // Danh sách permissions cần thêm
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
                name: "Update User",
                resource: "User",
                action: "update",
                description: "Permission to update user information"
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

            // ===== KIT PERMISSIONS =====
            {
                name: "Create Kit",
                resource: "Kit",
                action: "create",
                description: "Permission to create new kits"
            },
            {
                name: "Read Kit",
                resource: "Kit",
                action: "read",
                description: "Permission to view kit information and list all kits"
            },
            {
                name: "Update Kit",
                resource: "Kit",
                action: "update",
                description: "Permission to update kit information"
            },
            {
                name: "Delete Kit",
                resource: "Kit",
                action: "delete",
                description: "Permission to delete kits"
            },

            // ===== COURSE PERMISSIONS =====
            {
                name: "Create Course",
                resource: "Course",
                action: "create",
                description: "Permission to create new courses"
            },
            {
                name: "Read Course",
                resource: "Course",
                action: "read",
                description: "Permission to view course information and list all courses"
            },
            {
                name: "Update Course",
                resource: "Course",
                action: "update",
                description: "Permission to update course information"
            },
            {
                name: "Delete Course",
                resource: "Course",
                action: "delete",
                description: "Permission to delete courses"
            },

            // ===== LESSON PERMISSIONS =====
            {
                name: "Create Lesson",
                resource: "Lesson",
                action: "create",
                description: "Permission to create new lessons"
            },
            {
                name: "Read Lesson",
                resource: "Lesson",
                action: "read",
                description: "Permission to view lesson information and list all lessons"
            },
            {
                name: "Update Lesson",
                resource: "Lesson",
                action: "update",
                description: "Permission to update lesson information"
            },
            {
                name: "Delete Lesson",
                resource: "Lesson",
                action: "delete",
                description: "Permission to delete lessons"
            },

            // ===== PRODUCT PERMISSIONS =====
            {
                name: "Create Product",
                resource: "Product",
                action: "create",
                description: "Permission to create new products"
            },
            {
                name: "Read Product",
                resource: "Product",
                action: "read",
                description: "Permission to view product information and list all products"
            },
            {
                name: "Update Product",
                resource: "Product",
                action: "update",
                description: "Permission to update product information"
            },
            {
                name: "Delete Product",
                resource: "Product",
                action: "delete",
                description: "Permission to delete products"
            },

            // ===== VIDEO PERMISSIONS =====
            {
                name: "Create Video",
                resource: "Video",
                action: "create",
                description: "Permission to create new videos"
            },
            {
                name: "Read Video",
                resource: "Video",
                action: "read",
                description: "Permission to view video information and list all videos"
            },
            {
                name: "Update Video",
                resource: "Video",
                action: "update",
                description: "Permission to update video information"
            },
            {
                name: "Delete Video",
                resource: "Video",
                action: "delete",
                description: "Permission to delete videos"
            },

            // ===== CATEGORY PERMISSIONS =====
            {
                name: "Create Category",
                resource: "Category",
                action: "create",
                description: "Permission to create new categories"
            },
            {
                name: "Read Category",
                resource: "Category",
                action: "read",
                description: "Permission to view category information and list all categories"
            },
            {
                name: "Update Category",
                resource: "Category",
                action: "update",
                description: "Permission to update category information"
            },
            {
                name: "Delete Category",
                resource: "Category",
                action: "delete",
                description: "Permission to delete categories"
            },

            // ===== DIY POST PERMISSIONS =====
            {
                name: "Create DIYPost",
                resource: "DIYPost",
                action: "create",
                description: "Permission to create new DIY posts"
            },
            {
                name: "Read DIYPost",
                resource: "DIYPost",
                action: "read",
                description: "Permission to view DIY post information and list all posts"
            },
            {
                name: "Update DIYPost",
                resource: "DIYPost",
                action: "update",
                description: "Permission to update DIY post information"
            },
            {
                name: "Delete DIYPost",
                resource: "DIYPost",
                action: "delete",
                description: "Permission to delete DIY posts"
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

            // ===== REPORT PERMISSIONS =====
            {
                name: "Create Report",
                resource: "Report",
                action: "create",
                description: "Permission to create reports"
            },
            {
                name: "Read Report",
                resource: "Report",
                action: "read",
                description: "Permission to view reports"
            },
            {
                name: "Update Report",
                resource: "Report",
                action: "update",
                description: "Permission to update reports"
            },
            {
                name: "Delete Report",
                resource: "Report",
                action: "delete",
                description: "Permission to delete reports"
            },

            // ===== ORDER REPORT PERMISSIONS =====
            {
                name: "Create OrderReport",
                resource: "OrderReport",
                action: "create",
                description: "Permission to create order reports"
            },
            {
                name: "Read OrderReport",
                resource: "OrderReport",
                action: "read",
                description: "Permission to view order report information and list all reports"
            },
            {
                name: "Update OrderReport",
                resource: "OrderReport",
                action: "update",
                description: "Permission to update order report status, assign staff, and add notes"
            },
            {
                name: "Delete OrderReport",
                resource: "OrderReport",
                action: "delete",
                description: "Permission to delete order reports"
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