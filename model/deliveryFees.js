const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  type: { type: String, required: true, default: "district" },
  value: { type: String, required: true, default: "Kilometer" },
  amount: { type: String, Number: true },
});

module.exports = mongoose.model("deliveryfees", cartSchema);
