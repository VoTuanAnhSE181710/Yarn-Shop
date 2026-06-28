import mongoose from 'mongoose';
import User from '../models/user.js';
import Role from '../models/role.js';
import { configDotenv } from 'dotenv';
import configDB from '../config/configDB.js';
import HashService from '../services/hash.service.js';
import RefreshToken from '../models/RefreshToken.js';
import Category from '../models/category.js';
import Product from '../models/product.js';
import Kit from '../models/kit.js';
import Course from '../models/course.js';
import Lesson from '../models/lesson.js';

configDotenv();

const uri = configDB.uri;

/**
 * Seed script - Reset database and create sample data
 * 
 * Usage: npm run seed
 */
const seedData = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(uri);

        console.log('📦 Connected to MongoDB');

        // Xóa dữ liệu cũ
        await mongoose.connection.db.dropCollection('users').catch(() => { });
        await mongoose.connection.db.dropCollection('roles').catch(() => { });
        await mongoose.connection.db.dropCollection('refreshtokens').catch(() => { });
        await mongoose.connection.db.dropCollection('logs').catch(() => { });
        await mongoose.connection.db.dropCollection('categories').catch(() => { });
        await mongoose.connection.db.dropCollection('videos').catch(() => { });
        await mongoose.connection.db.dropCollection('products').catch(() => { });
        await mongoose.connection.db.dropCollection('kits').catch(() => { });
        await mongoose.connection.db.dropCollection('courses').catch(() => { });
        await mongoose.connection.db.dropCollection('lessons').catch(() => { });
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
        const hashService = new HashService();
        const hashedPassword = await hashService.hash({ string: "123456" });

        // 3. Tạo Users
        const seededUsers = await User.insertMany([
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
            },
            {
                username: "hoangmu",
                email: "hoangmu@example.com",
                password: hashedPassword,
                phone: "0987654321",
                fullName: "Hoang MU",
                gender: "MALE",
                dateOfBirth: new Date("2000-01-01"),
                address: "Hanoi, Vietnam",
                roleId: customerRole._id,
                subscription: "Premium",
                status: "ACTIVE"
            }
        ]);

        console.log('✅ Users created:', seededUsers.length);
        const staff1 = seededUsers.find(u => u.username === "staff1");

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

        // 5. Tạo Products (Yarn, Hook, etc.)
        const products = await Product.insertMany([
            {
                name: "Len Milk Cotton 125g",
                description: "Len sợi mềm mại phù hợp móc thú bông, khăn len, mũ len ấm áp.",
                category: "yarn",
                image: "https://res.cloudinary.com/dkylzuqgl/image/upload/v1/yarn-shop/milk_cotton.jpg",
                variants: [
                    { color: "Đỏ", hexCode: "#FF0000", price: 45000, stock: 150 },
                    { color: "Xanh Dương", hexCode: "#0000FF", price: 45000, stock: 120 }
                ],
                isActive: true
            },
            {
                name: "Kim móc len Clover Nhật Bản",
                description: "Kim móc cán dẻo cao cấp giúp êm tay khi móc lâu.",
                category: "hook",
                image: "https://res.cloudinary.com/dkylzuqgl/image/upload/v1/yarn-shop/clover_hook.jpg",
                variants: [
                    { color: "Vàng", hexCode: "#FFD700", price: 75000, stock: 80 }
                ],
                isActive: true
            }
        ]);

        console.log('✅ Products created:', products.length);
        const [yarnProduct, hookProduct] = products;

        // 6. Tạo Kits / Combos
        const kits = await Kit.insertMany([
            {
                name: "Combo Móc Khăn Len Ấm Áp",
                description: "Bộ kit đầy đủ nguyên liệu len, kim móc và kim khâu để hoàn thành một chiếc khăn len xinh xắn.",
                thumbnail: "https://res.cloudinary.com/dkylzuqgl/image/upload/v1/yarn-shop/scarf_kit.jpg",
                level: "beginner",
                price: 150000,
                productIds: [yarnProduct._id, hookProduct._id],
                isActive: true
            }
        ]);

        console.log('✅ Kits (Combos) created:', kits.length);
        const scarfKit = kits[0];

        // 7. Tạo Courses
        const courses = await Course.insertMany([
            {
                title: "Khóa học móc khăn len cho người mới bắt đầu",
                description: "Hướng dẫn từng bước một để móc hoàn chỉnh chiếc khăn len ấm áp thời trang từ con số 0.",
                thumbnail: "https://res.cloudinary.com/dkylzuqgl/image/upload/v1/yarn-shop/course_scarf.jpg",
                level: "beginner",
                tags: ["móc len", "khăn len", "cơ bản"],
                creatorId: staff1._id,
                totalDuration: 25, // Tự động cập nhật lại qua lessons sau
                totalLessons: 2,
                rating: 4.9,
                enrolledCount: 42,
                linkedComboIds: [scarfKit._id],
                isPublished: true
            }
        ]);

        console.log('✅ Courses created:', courses.length);
        const scarfCourse = courses[0];

        // 8. Tạo Lessons kèm theo linkedProducts & linkedCombos
        const lessons = await Lesson.insertMany([
            {
                courseId: scarfCourse._id,
                title: "Bài 1: Làm quen với dụng cụ & học mũi móc bính",
                order: 1,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration: 10,
                isPreview: true, // Xem thử miễn phí
                linkedProducts: [
                    {
                        productId: yarnProduct._id,
                        timestamp: 45, // Phút/Giây liên kết
                        name: yarnProduct.name,
                        price: yarnProduct.variants[0].price,
                        thumbnail: yarnProduct.image
                    },
                    {
                        productId: hookProduct._id,
                        timestamp: 90,
                        name: hookProduct.name,
                        price: hookProduct.variants[0].price,
                        thumbnail: hookProduct.image
                    }
                ],
                linkedCombos: [
                    {
                        comboId: scarfKit._id,
                        timestamp: 120,
                        name: scarfKit.name,
                        price: scarfKit.price,
                        thumbnail: scarfKit.thumbnail
                    }
                ]
            },
            {
                courseId: scarfCourse._id,
                title: "Bài 2: Hướng dẫn móc mũi móc đơn và ráp khăn",
                order: 2,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration: 15,
                isPreview: false, // Yêu cầu tài khoản đăng nhập (auth required)
                linkedProducts: [
                    {
                        productId: yarnProduct._id,
                        timestamp: 180,
                        name: yarnProduct.name,
                        price: yarnProduct.variants[0].price,
                        thumbnail: yarnProduct.image
                    }
                ],
                linkedCombos: []
            }
        ]);

        console.log('✅ Lessons created:', lessons.length);

        // Kích hoạt lại tổng số bài học và tổng thời lượng của khóa học
        const stats = await Lesson.aggregate([
            { $match: { courseId: scarfCourse._id } },
            {
                $group: {
                    _id: "$courseId",
                    totalDuration: { $sum: "$duration" },
                    totalLessons: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            scarfCourse.totalDuration = stats[0].totalDuration;
            scarfCourse.totalLessons = stats[0].totalLessons;
            await scarfCourse.save();
            console.log('📊 Recalculated and updated Course stats successfully');
        }

        // 9. Hiển thị thông tin login
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
        console.log('\n⭐ Test Account (Premium):');
        console.log('   Username: hoangmu | Email: hoangmu@example.com');
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