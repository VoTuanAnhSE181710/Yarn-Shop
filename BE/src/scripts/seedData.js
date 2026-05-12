import mongoose from 'mongoose';
import User from '../models/user.js';
import Role from '../models/role.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';
import HashService from '../services/hash.service.js';
import RefreshToken from '../models/RefreshToken.js';

configDotenv();

const uri = configDB.uri;

/**
 * Seed script - Reset database and create sample data
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Clear all existing data (Users, Roles)
 * 3. Create sample Roles (Admin, Supervisor, Customer)
 * 4. Create sample Users with hashed passwords
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
        console.log('🗑️  Cleared old data');

        // 1. Tạo Roles
        const roles = await Role.insertMany([
            { roleName: "Admin" },
            { roleName: "Supervisor" },
            { roleName: "Customer" }
        ]);

        console.log('✅ Roles created:', roles.length);

        const [adminRole, supervisorRole, customerRole] = roles;

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
                status: "ACTIVE"
            },
            {
                username: "supervisor1",
                email: "supervisor1@example.com",
                password: hashedPassword,
                phone: "0902345678",
                fullName: "John Supervisor",
                gender: "MALE",
                dateOfBirth: new Date("1988-05-20"),
                address: "Supervisor Office, Building B",
                roleId: supervisorRole._id,
                status: "ACTIVE"
            },
            {
                username: "supervisor2",
                email: "supervisor2@example.com",
                password: hashedPassword,
                phone: "0903456789",
                fullName: "Sarah Supervisor",
                gender: "FEMALE",
                dateOfBirth: new Date("1990-08-12"),
                address: "Supervisor Office, Building C",
                roleId: supervisorRole._id,
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
                status: "INACTIVE"
            }
        ]);

        console.log('✅ Users created:', users.length);

        // 4. Hiển thị thông tin login
        console.log('\n🔑 Login Credentials (Password: 123456):');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('👨‍💼 Admin:');
        console.log('   Username: admin | Email: admin@example.com');
        console.log('\n👔 Supervisors:');
        console.log('   Username: supervisor1 | Email: supervisor1@example.com');
        console.log('   Username: supervisor2 | Email: supervisor2@example.com');
        console.log('\n� Customers (Active):');
        console.log('   Username: customer1 | Email: customer1@example.com');
        console.log('   Username: customer2 | Email: customer2@example.com');
        console.log('\n⏸️  Customers (Inactive):');
        console.log('   Username: customer3 | Email: customer3@example.com');
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