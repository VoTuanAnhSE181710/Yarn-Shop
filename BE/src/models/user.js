import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required!"],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required!"],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ["MALE", "FEMALE"]
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },  
    address: {
        type: String,
        required: true
    },
    avatar: {
        type: {
            url: { type: String, default: null },
            publicId: { type: String, default: null },
        },
        required: false,
    },
    subscription: {
        type: String,
        enum: ["Freemium", "Premium"],
        default: "Freemium"
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ["ACTIVE", "INACTIVE", "LOCKED"]
    },
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    enrolled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }]
})

userSchema.virtual("role", {
    ref: "Role",
    localField: "roleId",
    foreignField: "_id",
    justOne: true
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;