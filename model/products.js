const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String, required: true },
  createdAt: { type: String, default: new Date() },
});

module.exports = mongoose.model("products", userSchema);
