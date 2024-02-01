const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  deliveryAmount: { type: Number, required: true },
  deliveryLocation: { type: String, required: true },
  deliveryDescription: { type: String, required: true },
  momoNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  status: { type: String, default: "PENDING" },
  transactionId: { type: String, default: "-", required: true },
  totalAmount: { type: Number, required: true },
  orderId: { type: Number, required: true },
  date: { type: String, default: new Date() },
});

module.exports = mongoose.model("orders", ordersSchema);
