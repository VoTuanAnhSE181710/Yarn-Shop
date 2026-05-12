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
 * Các permissions đã có trong DB (không thêm):
 * - 11 permissions với action "manage" cho các resources
 * - Update User
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

            // ===== EQUIPMENT PERMISSIONS =====
            {
                name: "Create Equipment",
                resource: "Equipment",
                action: "create",
                description: "Permission to create new equipment"
            },
            {
                name: "Read Equipment",
                resource: "Equipment",
                action: "read",
                description: "Permission to view equipment information and list"
            },
            {
                name: "Update Equipment",
                resource: "Equipment",
                action: "update",
                description: "Permission to update equipment information"
            },
            {
                name: "Delete Equipment",
                resource: "Equipment",
                action: "delete",
                description: "Permission to soft delete equipment"
            },

            // ===== INSTRUMENT PERMISSIONS =====
            {
                name: "Create Instrument",
                resource: "Instrument",
                action: "create",
                description: "Permission to create new instruments"
            },
            {
                name: "Read Instrument",
                resource: "Instrument",
                action: "read",
                description: "Permission to view instrument information and list"
            },
            {
                name: "Update Instrument",
                resource: "Instrument",
                action: "update",
                description: "Permission to update instrument information and assign engineers"
            },
            {
                name: "Delete Instrument",
                resource: "Instrument",
                action: "delete",
                description: "Permission to soft delete instruments"
            },

            // ===== WAREHOUSE PERMISSIONS =====
            {
                name: "Create Warehouse",
                resource: "Warehouse",
                action: "create",
                description: "Permission to create new warehouses and receive inventory"
            },
            {
                name: "Read Warehouse",
                resource: "Warehouse",
                action: "read",
                description: "Permission to view warehouse information and inventory"
            },
            {
                name: "Update Warehouse",
                resource: "Warehouse",
                action: "update",
                description: "Permission to update warehouse information"
            },
            {
                name: "Delete Warehouse",
                resource: "Warehouse",
                action: "delete",
                description: "Permission to delete warehouses"
            },

            // ===== INCIDENT PERMISSIONS =====
            {
                name: "Create Incident",
                resource: "Incident",
                action: "create",
                description: "Permission to create incident reports"
            },
            {
                name: "Read Incident",
                resource: "Incident",
                action: "read",
                description: "Permission to view incident reports and list"
            },
            {
                name: "Update Incident",
                resource: "Incident",
                action: "update",
                description: "Permission to update incident reports"
            },
            {
                name: "Delete Incident",
                resource: "Incident",
                action: "delete",
                description: "Permission to delete incident reports"
            },

            // ===== MAINTENANCE SCHEDULE PERMISSIONS =====
            {
                name: "Create Maintenance Schedule",
                resource: "MaintenanceSchedule",
                action: "create",
                description: "Permission to create maintenance schedules"
            },
            {
                name: "Read Maintenance Schedule",
                resource: "MaintenanceSchedule",
                action: "read",
                description: "Permission to view maintenance schedules and statistics"
            },
            {
                name: "Update Maintenance Schedule",
                resource: "MaintenanceSchedule",
                action: "update",
                description: "Permission to update, start, complete, or cancel maintenance schedules"
            },
            {
                name: "Delete Maintenance Schedule",
                resource: "MaintenanceSchedule",
                action: "delete",
                description: "Permission to delete maintenance schedules"
            },

            // ===== MAINTENANCE HISTORY PERMISSIONS =====
            {
                name: "Create Maintenance History",
                resource: "MaintenanceHistory",
                action: "create",
                description: "Permission to create maintenance history records"
            },
            {
                name: "Read Maintenance History",
                resource: "MaintenanceHistory",
                action: "read",
                description: "Permission to view maintenance history and export reports"
            },
            {
                name: "Update Maintenance History",
                resource: "MaintenanceHistory",
                action: "update",
                description: "Permission to update maintenance history records"
            },
            {
                name: "Delete Maintenance History",
                resource: "MaintenanceHistory",
                action: "delete",
                description: "Permission to delete maintenance history records"
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
