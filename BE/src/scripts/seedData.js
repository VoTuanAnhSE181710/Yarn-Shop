import mongoose from 'mongoose';
import User from '../models/user.js';
import Role from '../models/role.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';
import HashService from '../services/hash.service.js';
import RefreshToken from '../models/RefreshToken.js';
import Category from '../models/category.js';

configDotenv();

const uri = configDB.uri;

/**
 * Seed script - Reset database and create sample data
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Clear all existing data (Users, Roles, Categories, Videos)
 * 3. Create sample Roles (Admin, Staff, Customer)
 * 4. Create sample Users with hashed passwords
 * 5. Create sample Categories for video classification
 * 
 * Usage: npm run seed
 * Default password for all users: 123456
 */
const seedData = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(uri)

        console.log('📦 Connected to MongoDB');

        // Xóa dữ liệu cũ - Drop collections để xóa cả indexes cũ
        await mongoose.connection.db.dropCollection('users').catch(() => {});
        await mongoose.connection.db.dropCollection('roles').catch(() => {});
        await mongoose.connection.db.dropCollection('refreshtokens').catch(() => {});
        await mongoose.connection.db.dropCollection('logs').catch(() => {});
        await mongoose.connection.db.dropCollection('categories').catch(() => {});
        await mongoose.connection.db.dropCollection('videos').catch(() => {});
        console.log('🗑️  Cleared old data');

        // 1. Tạo Roles
        const roles = await Role.insertMany([
            { roleName: "Admin" },
            { roleName: "Staff" },
            { roleName: "Customer" }
        ]);

        console.log('✅ Roles created:', roles.length);

        const [adminRole, staffRole, customerRole] = roles;

        // 2. Hash password
        const hashService = new HashService()

        const hashedPassword = await hashService.hash({ string: "123456"})

        // 3. Tạo Users
        const users = await User.insertMany([
            {
                username: "admin",
                email: "admin@example.com",
                password: hashedPassword,
                phone: "0901234567",
                fullName: "System Administrator",
                gender: "MALE",
                dateOfBirth: new Date("1985-01-15"),
                address: "Admin Office, Building A",
                roleId: adminRole._id,
                subscription: "Premium",
                status: "ACTIVE"
            },
            {
                username: "staff1",
                email: "staff1@example.com",
                password: hashedPassword,
                phone: "0902345678",
                fullName: "John Staff",
                gender: "MALE",
                dateOfBirth: new Date("1988-05-20"),
                address: "Staff Office, Building B",
                roleId: staffRole._id,
                subscription: "Premium",
                status: "ACTIVE"
            },
            {
                username: "staff2",
                email: "staff2@example.com",
                password: hashedPassword,
                phone: "0903456789",
                fullName: "Sarah Staff",
                gender: "FEMALE",
                dateOfBirth: new Date("1990-08-12"),
                address: "Staff Office, Building C",
                roleId: staffRole._id,
                subscription: "Premium",
                status: "ACTIVE"
            },
            {
                username: "customer1",
                email: "customer1@example.com",
                password: hashedPassword,
                phone: "0904567890",
                fullName: "Jane Customer",
                gender: "FEMALE",
                dateOfBirth: new Date("1992-03-25"),
                address: "Customer Address, District 1",
                roleId: customerRole._id,
                subscription: "Freemium",
                status: "ACTIVE"
            },
            {
                username: "customer2",
                email: "customer2@example.com",
                password: hashedPassword,
                phone: "0905678901",
                fullName: "Mike Customer",
                gender: "MALE",
                dateOfBirth: new Date("1993-11-30"),
                address: "Customer Address, District 2",
                roleId: customerRole._id,
                subscription: "Premium",
                status: "ACTIVE"
            },
            {
                username: "customer3",
                email: "customer3@example.com",
                password: hashedPassword,
                phone: "0906789012",
                fullName: "Alice Customer",
                gender: "FEMALE",
                dateOfBirth: new Date("1995-07-18"),
                address: "Customer Address, District 3",
                roleId: customerRole._id,
                subscription: "Freemium",
                status: "INACTIVE"
            }
        ]);

        console.log('✅ Users created:', users.length);

        // 4. Tạo Categories
        const categories = await Category.insertMany([
            {
                name: "Đan móc cơ bản",
                slug: "dan-moc-co-ban",
                description: "Các video hướng dẫn đan móc cho người mới bắt đầu"
            },
            {
                name: "Mũ và khăn",
                slug: "mu-va-khan",
                description: "Hướng dẫn đan mũ, khăn và phụ kiện"
            },
            {
                name: "Áo và váy",
                slug: "ao-va-vay",
                description: "Hướng dẫn đan áo, váy và trang phục"
            },
            {
                name: "Thú bông & đồ chơi",
                slug: "thu-bong-do-choi",
                description: "Hướng dẫn đan thú bông, gấu bông và đồ chơi"
            },
            {
                name: "Đồ trang trí",
                slug: "do-trang-tri",
                description: "Hướng dẫn đan đồ trang trí nhà cửa"
            }
        ]);

        console.log('✅ Categories created:', categories.length);

        // 5. Hiển thị thông tin login
        console.log('\n🔑 Login Credentials (Password: 123456):');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('👨‍💼 Admin (Premium):');
        console.log('   Username: admin | Email: admin@example.com');
        console.log('\n👔 Staff (Premium):');
        console.log('   Username: staff1 | Email: staff1@example.com');
        console.log('   Username: staff2 | Email: staff2@example.com');
        console.log('\n🧶 Customers:');
        console.log('   customer1 (Freemium) - Active');
        console.log('   customer2 (Premium)  - Active');
        console.log('   customer3 (Freemium) - Inactive');
        console.log('═══════════════════════════════════════════════════════════');

        await mongoose.connection.close();
        console.log('\n✨ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedData();