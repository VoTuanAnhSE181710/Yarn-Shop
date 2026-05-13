import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    resource: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ["create", "read", "update", "delete", "manage", "assign", "receive", "dispatch", "unassign"],
    },
    description: {
        type: String
    }
},
{
    timestamps: true
});

const Permission = mongoose.model("Permission", permissionSchema, "permissions");
export default Permission;