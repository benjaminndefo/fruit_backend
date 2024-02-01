const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");

const Orders = require("../model/orders");
const Users = require("../model/users");
const Cart = require("../model/cart");
const axios = require("axios");
const { randomNumber } = require("../helpers");

const getOnlineTransactions = async () => {
  try {
    const transactions = await axios.get(
      "https://mobile-mers-backend.onrender.com/api/v3/transactions/"
    );
    for (let i = 0; i < transactions.data.transactions.length; i++) {
      await Orders.updateOne(
        { transactionId: transactions.data.transactions[i].transactionId },
        {
          status: transactions.data.transactions[i].status,
          // spTransactionId: transactions.data.transactions[i].spTransactionId,
        }
      );
    }
  } catch (error) {
    return error.message;
  }
};

router.get("/", auth, async (req, res) => {
  try {
    const transactions = [];
    const onlineTransactions = await getOnlineTransactions();
    const allTransactions = await Orders.find({
      customerId: req.user._id,
    });
    for (let i = 0; i < allTransactions.length; i++) {
      const products = await Cart.find({
        orderId: allTransactions[i]._id,
      });

      transactions.push({
        ...allTransactions[i]._doc,
        products,
      });
    }
    return res
      .status(200)
      .send({ msg: "Orders fetched successfully", orders: transactions });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  const {
    deliveryLocation,
    deliveryDescription,
    deliveryAmount,
    cartTotal,
    phoneNumber,
  } = req.body;
  const amount = Number(cartTotal) + Number(deliveryAmount);
  try {
    if (
      !(
        deliveryLocation &&
        deliveryDescription &&
        deliveryAmount &&
        cartTotal &&
        phoneNumber
      )
    ) {
      return res.status(400).send({ msg: "All fields are required" });
    }

    //payment
    const transactionId = uuidv4();
    const organizationId = "10fddf2a-0883-41c0-aa6d-74c98ec3b792";
    const description = "Payment";
    const callbackUrl = `https://mobile-mers-backend.onrender.com/api/v3/transactions/`;

    const pay = await axios.post(
      "https://opay-api.oltranz.com/opay/paymentrequest",
      {
        telephoneNumber: phoneNumber,
        amount: amount,
        organizationId: organizationId,
        description: description,
        callbackUrl: callbackUrl,
        transactionId: transactionId,
      }
    );
    if (pay) {
      const order = await Orders.create({
        orderId: randomNumber(),
        status: pay.data.status,
        transactionId,
        customerId: req.user._id,
        totalAmount: amount,
        deliveryLocation,
        deliveryDescription,
        momoNumber: phoneNumber,
        deliveryAmount,
      });

      //update cart
      await Cart.updateMany(
        {
          customerId: req.user._id,
          paymentInitialised: false,
        },
        { orderId: order._id, paymentInitialised: true }
      );
      //udpate cart
      return res.status(201).json({ msg: pay.data.description, success: true });
    }

    //payment
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

module.exports = router;
