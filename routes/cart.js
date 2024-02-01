const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");
const { verifyToken, getMyIp } = require("../helpers");

const Cart = require("../model/cart");
const Orders = require("../model/orders");

router.get("/", (req, res) => {
  const token =
    req.body.token || req.query.token || req.headers["access-token"];
  if (!token) {
    Cart.find(
      { ipAddress: getMyIp(req), paymentInitialised: false },
      (err, result) => {
        if (err) {
          return res.status(400).send(err);
        } else {
          res.status(200).send({ result });
        }
      }
    );
  } else {
    if (verifyToken(token)) {
      Cart.find(
        { customerId: verifyToken(token)._id, paymentInitialised: false },
        (err, result) => {
          if (err) {
            return res.status(400).send(err);
          } else {
            res.status(200).send({ result });
          }
        }
      );
    } else {
      return res.status(401).send({ msg: "invalid token", tokenError: true });
    }
  }
});

router.post("/cancelOrder/", auth, async (req, res) => {
  const { totalAmount, pickupDate, pickupTime, managerId } = req.body;
  try {
    const newOrder = await Orders.create({
      status: "failed",
      totalAmount,
      pickupDate,
      pickupTime,
      managerId,
      customerId: req.user._id,
    });
    await Cart.updateMany(
      {
        customerId: req.user._id,
        paymentInitialised: false,
      },
      { paymentInitialised: true, orderId: newOrder._id }
    );
    return res
      .status(200)
      .send({ msg: "Order information recorded successfull." });
  } catch (error) {
    return res.status(409).send({ msg: error.message });
  }
});

router.post("/completedOrder/", auth, async (req, res) => {
  const { totalAmount, pickupDate, pickupTime, managerId, transactionId } =
    req.body;
  try {
    const newOrder = await Orders.create({
      status: "paid",
      totalAmount,
      pickupDate,
      pickupTime,
      managerId,
      transactionId,
      customerId: req.user._id,
    });
    await Cart.updateMany(
      {
        customerId: req.user._id,
        paymentInitialised: false,
      },
      { paymentInitialised: true, orderId: newOrder._id }
    );
    return res
      .status(200)
      .send({ msg: "Order payment completed successfull." });
  } catch (error) {
    return res.status(409).send({ msg: error.message });
  }
});

router.post("/completedOrder2/", auth, async (req, res) => {
  const { i, totalAmount, transactionId } = req.body;
  try {
    await Orders.updateOne(
      { _id: i, customerId: req.user._id },
      {
        status: "paid",
        transactionId,
        totalAmount,
      }
    );
    await Cart.updateMany(
      {
        customerId: req.user._id,
        paymentInitialised: false,
      },
      { paymentInitialised: true, orderId: i }
    );
    return res
      .status(200)
      .send({ msg: "Order payment completed successfull." });
  } catch (error) {
    return res.status(409).send({ msg: error.message });
  }
});

router.post("/", async (req, res) => {
  const { price, quantity, productId } = req.body;
  try {
    if (req.body?.token && verifyToken(req.body?.token)) {
      const itemExists = await Cart.findOne({
        productId,
        customerId: verifyToken(req.body.token)._id,
        paymentInitialised: false,
      });

      if (itemExists) {
        return res
          .status(409)
          .send({ msg: "Item already exists in the cart." });
      }

      const rm = await Cart.create({
        productId,
        customerId: verifyToken(req.body.token)._id,
        quantity,
        price: price,
      });
      res.status(201).json({
        msg: "Item Added to cart successfull!",
        item: rm,
      });
    } else {
      const itemExists = await Cart.findOne({
        productId,
        ipAddress: getMyIp(req),
        paymentInitialised: false,
      });

      if (itemExists) {
        return res
          .status(409)
          .send({ msg: "Item already exists in the cart." });
      }

      const rm = await Cart.create({
        productId,
        ipAddress: getMyIp(req),
        quantity: quantity,
        price: price,
      });
      res.status(201).json({
        msg: "Item Added to cart successfull!",
        item: rm,
      });
    }
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

router.post("/giveCart/", auth, async (req, res) => {
  try {
    await Cart.updateMany(
      { ipAddress: getMyIp(req) },
      {
        customerId: req.user._id,
        ipAddress: "",
      }
    );
    res.status(201).json({
      msg: "Cart Updated successfull!",
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

router.post("/update/", async (req, res) => {
  const { quantity, id } = req.body;
  try {
    if (req.body?.token && verifyToken(req.body?.token)) {
      await Cart.updateOne(
        { _id: id, customerId: verifyToken(req.body.token)._id },
        {
          quantity: quantity,
        }
      );
      res.status(201).json({
        msg: "Cart Item Updated successfull!",
      });
    } else {
      await Cart.updateOne(
        { _id: id, ipAddress: getMyIp(req) },
        {
          quantity: quantity,
        }
      );
      res.status(201).json({
        msg: "Cart Item Updated successfull!",
      });
    }
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

router.post("/delete/", async (req, res) => {
  const { id } = req.body;
  try {
    if (req.body?.token && verifyToken(req.body?.token)) {
      await Cart.deleteOne({
        _id: id,
        customerId: verifyToken(req.body.token)._id,
        paymentInitialised: false,
      });
      res.status(201).json({
        msg: "Cart Item Deleted successfull!",
      });
    } else {
      await Cart.deleteOne({
        _id: id,
        ipAddress: getMyIp(req),
        paymentInitialised: false,
      });
      res.status(201).json({
        msg: "Cart Item Deleted successfull!",
      });
    }
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
});

module.exports = router;
