import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();

async function run() {
    try {
        await mongoose.connect(process.env.PROD_MONGODB_URI);
        const Order = mongoose.connection.collection("orders");
        const RefundInvoice = mongoose.connection.collection("refundinvoices");
        
        // Find all refund invoices that are PROCESSED or REJECTED
        const invoices = await RefundInvoice.find({ 
            status: { $in: ["PROCESSED", "REJECTED"] }
        }).toArray();

        let count = 0;
        for (const invoice of invoices) {
            // Update the corresponding order status
            const result = await Order.updateOne(
                { _id: invoice.orderId },
                { $set: { orderStatus: invoice.status, isCancelRequested: false } }
            );
            if (result.modifiedCount > 0) {
                count++;
            }
        }
        console.log(`Updated ${count} orders to match their refund invoice status.`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
