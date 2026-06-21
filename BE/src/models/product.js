import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    color: {
        type: String,
        required: [true, "Color is required!"],
        trim: true,
    },
    hexCode: {
        type: String,
        required: [true, "Hex code is required!"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required!"],
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required!"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required!"],
    },
    category: {
        type: String,
        enum: ["yarn", "hook", "kit", "accessory", "tool"],
        required: [true, "Category is required!"],
    },
    image: {
        type: String,
        required: [true, "Image is required!"],
    },
    images: [{
        type: String,
    }],
    tags: [{
        type: String,
    }],
    variants: {
        type: [variantSchema],
        required: [true, "At least one variant is required!"],
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

const Product = mongoose.model("Product", productSchema, "products");
export default Product;