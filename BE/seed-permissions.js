import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import configDB from "./src/config/configDB.js";
configDotenv();

const MONGODB_URI = configDB.uri;

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String },
}, { timestamps: true });

const Permission = mongoose.model("Permission", permissionSchema);

const permissions = [
    // User
    { name: "User - Read",           resource: "User",        action: "read",   description: "Xem thông tin người dùng" },
    { name: "User - Create",         resource: "User",        action: "create", description: "Tạo người dùng mới" },
    { name: "User - Update",         resource: "User",        action: "update", description: "Cập nhật thông tin người dùng" },
    { name: "User - Delete",         resource: "User",        action: "delete", description: "Xoá người dùng" },

    // Order
    { name: "Order - Read",          resource: "Order",       action: "read",   description: "Xem đơn hàng" },
    { name: "Order - Create",        resource: "Order",       action: "create", description: "Tạo đơn hàng / thanh toán" },
    { name: "Order - Update",        resource: "Order",       action: "update", description: "Cập nhật trạng thái đơn hàng" },
    { name: "Order - Delete",        resource: "Order",       action: "delete", description: "Xoá đơn hàng" },

    // Product
    { name: "Product - Read",        resource: "Product",     action: "read",   description: "Xem thống kê sản phẩm" },
    { name: "Product - Create",      resource: "Product",     action: "create", description: "Tạo sản phẩm mới" },
    { name: "Product - Update",      resource: "Product",     action: "update", description: "Cập nhật sản phẩm" },
    { name: "Product - Delete",      resource: "Product",     action: "delete", description: "Xoá sản phẩm" },

    // Course
    { name: "Course - Create",       resource: "Course",      action: "create", description: "Tạo khoá học mới" },
    { name: "Course - Update",       resource: "Course",      action: "update", description: "Cập nhật khoá học" },
    { name: "Course - Delete",       resource: "Course",      action: "delete", description: "Xoá khoá học" },

    // Kit
    { name: "Kit - Create",          resource: "Kit",         action: "create", description: "Tạo kit mới" },
    { name: "Kit - Update",          resource: "Kit",         action: "update", description: "Cập nhật kit" },
    { name: "Kit - Delete",          resource: "Kit",         action: "delete", description: "Xoá kit" },

    // DIYPost
    { name: "DIYPost - Create",      resource: "DIYPost",     action: "create", description: "Tạo bài DIY mới" },
    { name: "DIYPost - Update",      resource: "DIYPost",     action: "update", description: "Cập nhật bài DIY" },
    { name: "DIYPost - Delete",      resource: "DIYPost",     action: "delete", description: "Xoá bài DIY" },

    // SupportDIY
    { name: "SupportDIY - Create",   resource: "SupportDIY",  action: "create", description: "Tạo hỗ trợ DIY mới" },
    { name: "SupportDIY - Update",   resource: "SupportDIY",  action: "update", description: "Cập nhật hỗ trợ DIY" },
    { name: "SupportDIY - Delete",   resource: "SupportDIY",  action: "delete", description: "Xoá hỗ trợ DIY" },

    // Role
    { name: "Role - Read",           resource: "Role",        action: "read",   description: "Xem vai trò" },
    { name: "Role - Create",         resource: "Role",        action: "create", description: "Tạo vai trò mới" },
    { name: "Role - Update",         resource: "Role",        action: "update", description: "Cập nhật vai trò" },
    { name: "Role - Delete",         resource: "Role",        action: "delete", description: "Xoá vai trò" },

    // Permission
    { name: "Permission - Read",     resource: "Permission",  action: "read",   description: "Xem quyền hạn" },
    { name: "Permission - Create",   resource: "Permission",  action: "create", description: "Tạo quyền hạn mới" },
    { name: "Permission - Update",   resource: "Permission",  action: "update", description: "Cập nhật quyền hạn" },
    { name: "Permission - Delete",   resource: "Permission",  action: "delete", description: "Xoá quyền hạn" },

    // OrderReport
    { name: "OrderReport - Read",    resource: "OrderReport", action: "read",   description: "Xem báo cáo đơn hàng" },
    { name: "OrderReport - Update",  resource: "OrderReport", action: "update", description: "Cập nhật báo cáo đơn hàng" },
    { name: "OrderReport - Delete",  resource: "OrderReport", action: "delete", description: "Xoá báo cáo đơn hàng" },

    // Log
    { name: "Log - Read",            resource: "Log",         action: "read",   description: "Xem nhật ký hệ thống" },

    // Video
    { name: "Video - Update",        resource: "Video",       action: "update", description: "Admin cập nhật video" },
    { name: "Video - Delete",        resource: "Video",       action: "delete", description: "Admin xoá video" },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Đã kết nối MongoDB");

        let added = 0;
        let skipped = 0;

        for (const perm of permissions) {
            const exists = await Permission.findOne({ name: perm.name });
            if (exists) {
                console.log(`⏭️  Bỏ qua (đã tồn tại): ${perm.name}`);
                skipped++;
            } else {
                await Permission.create(perm);
                console.log(`➕ Đã thêm: ${perm.name}`);
                added++;
            }
        }

        console.log(`\n🎉 Xong! Đã thêm ${added} permission mới, bỏ qua ${skipped} cái đã có.`);
    } catch (err) {
        console.error("❌ Lỗi:", err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
