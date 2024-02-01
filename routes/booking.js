const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Axios = require("axios");

const { randomNumber } = require("../helpers/");

const Playgrounds = require("../model/playgrounds");
const PlaygroundsHours = require("../model/playgroundsHours");
const BookedHours = require("../model/bookedHours");
const Transactions = require("../model/transactions");
const Users = require("../model/users");

const getOnlineTransactions = async () => {
  try {
    const transactions = await Axios.get(
      "https://mobile-mers-backend.onrender.com/api/transactions/"
    );
    for (let i = 0; i < transactions.data.transactions.length; i++) {
      await Transactions.updateOne(
        { transactionId: transactions.data.transactions[i].transactionId },
        {
          status: transactions.data.transactions[i].status,
          spTransactionId: transactions.data.transactions[i].spTransactionId,
        }
      );
    }
  } catch (error) {
    return error.message;
  }
};

router.post("/", auth, async (req, res) => {
  const {
    id,
    organisationName,
    selectedHours,
    price,
    bookedDate,
    phoneNumber,
  } = req.body;
  const amount = price * selectedHours.length;
  try {
    if (selectedHours.length === 0) {
      return res
        .status(400)
        .send({ msg: "Please choose hours you want to book" });
    }
    for (let i = 0; i < selectedHours.length; i++) {
      const isBooked = await BookedHours.findOne({
        from: selectedHours[i].from,
        to: selectedHours[i].to,
        bookedDate,
        playgroundId: id,
      });
      console.log(isBooked);
      if (isBooked) {
        return res.status(400).send({
          msg: `This playground has already been booked same date, same hour: ${selectedHours[i].from}-${selectedHours[i].to}. remove this hour or try a different date.`,
        });
      }
    }
    //payment
    const trans = await Axios.get("https://www.uuidgenerator.net/api/version4");
    if (trans) {
      const transactionId = trans.data;
      const organizationId = "10fddf2a-0883-41c0-aa6d-74c98ec3b792";
      const description = "payment request with endpoints for playground";
      const callbackUrl = `https://mobile-mers-backend.onrender.com/api/transactions/`;

      const pay = await Axios.post(
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
        await Transactions.create({
          randomTransactionId: randomNumber(),
          status: pay.data.status,
          transactionId,
          userId: req.user.user_id,
          bookedDate,
          amountPaid: amount,
          playgroundId: id,
          bookedDate,
          organisationName,
        });

        //book hours
        for (let i = 0; i < selectedHours.length; i++) {
          await BookedHours.create({
            transactionId: transactionId,
            from: selectedHours[i].from,
            to: selectedHours[i].to,
            playgroundId: id,
            userId: req.user.user_id,
            bookedDate,
          });
        }
        //book hours
        return res
          .status(201)
          .json({ msg: pay.data.description, success: true });
      }
    } else {
      return res.status(400).send({
        msg: "Something went wrong, try again later!",
      });
    }
    //payment

    // const playgrounds = await Playgrounds.find({});
    // return res.status(200).send({ playgrounds });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const transactions = [];
    const onlineTransactions = await getOnlineTransactions();
    const allTransactions = await Transactions.find({
      userId: req.user.user_id,
    });
    for (let i = 0; i < allTransactions.length; i++) {
      const playground = await Playgrounds.findOne({
        _id: allTransactions[i].playgroundId,
      });
      const bookedHours = await BookedHours.find({
        transactionId: allTransactions[i].transactionId,
      });
      const client = await Users.findOne({ _id: allTransactions[i].userId });

      transactions.push({
        ...allTransactions[i]._doc,
        playground,
        bookedHours,
        client,
      });
    }
    return res
      .status(200)
      .send({ msg: "Transactions fetched successfully", transactions });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.get("/all/", auth, async (req, res) => {
  try {
    const transactions = [];
    const printer = req.query["printer"];
    if (!printer) {
      await getOnlineTransactions();
    }
    const allTransactions = await Transactions.find({});
    for (let i = 0; i < allTransactions.length; i++) {
      const playground = await Playgrounds.findOne({
        _id: allTransactions[i].playgroundId,
      });
      const bookedHours = await BookedHours.find({
        transactionId: allTransactions[i].transactionId,
      });
      const client = await Users.findOne({ _id: allTransactions[i].userId });
      transactions.push({
        ...allTransactions[i]._doc,
        playground,
        bookedHours,
        client,
      });
    }
    return res
      .status(200)
      .send({ msg: "Transactions fetched successfully", transactions });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  const id = req.params["id"];
  try {
    const transaction = [];
    const allTransactions = await Transactions.find({
      userId: req.user.user_id,
      _id: id,
    });
    for (let i = 0; i < allTransactions.length; i++) {
      const playground = await Playgrounds.findOne({
        _id: allTransactions[i].playgroundId,
      });
      const bookedHours = await BookedHours.find({
        transactionId: allTransactions[i].transactionId,
      });

      transaction.push({
        ...allTransactions[i]._doc,
        playground,
        bookedHours,
      });
    }
    return res
      .status(200)
      .send({ msg: "Transactions fetched successfully", transaction });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

module.exports = router;
