const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  ipAddress: { type: String },
  customerId: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  orderId: { type: String, default: "-", required: true },
  paymentInitialised: { type: Boolean, default: false, required: true },
});
 
module.exports = mongoose.model("cart", cartSchema);
