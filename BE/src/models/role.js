import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
    },
    permission: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission"
    }],
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

const Role = mongoose.model("Role", roleSchema, "roles");
export default Role;