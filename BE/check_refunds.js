import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

async function run() {
    try {
        await mongoose.connect(process.env.PROD_MONGODB_URI);
        const count = await mongoose.connection.collection("refundinvoices").countDocuments({});
        const items = await mongoose.connection.collection("refundinvoices").find({}).toArray();
        console.log("Total RefundInvoices:", count);
        console.log(items);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
