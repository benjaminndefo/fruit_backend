const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const DeliveryFees = require("../model/deliveryFees");

router.get("/", (req, res) => {
  DeliveryFees.find({}, (err, result) => {
    if (err) {
      return res.status(400).send(err);
    } else {
      res.status(200).send({ deliveryFees: result });
    }
  });
});

router.post("/", async (req, res) => {
  const { type, value, amount } = req.body;
  try {
    const itemExists = await DeliveryFees.findOne({
      type,
      value,
    });

    if (itemExists) {
      return res.status(409).send({ msg: "Item already exists." });
    }

    const rm = await DeliveryFees.create({
      type,
      value,
      amount,
    });
    res.status(201).json({
      msg: "Delivery Fees saved!",
      item: rm,
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

router.put("/", async (req, res) => {
  const { amount, _id } = req.body;
  try {
    await DeliveryFees.updateOne(
      { _id },
      {
        amount,
      }
    );
    res.status(201).json({
      msg: "Fees updated!",
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

module.exports = router;
