const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");
const Categories = require("../model/productCategories");

const Products = require("../model/products");

router.get("/", async (req, res) => {
  try {
    const products = [];
    const allProds = await Products.find({});
    for (let i = 0; i < allProds.length; i++) {
      const categoryDetails = await Categories.findOne({
        _id: allProds[i].categoryId,
      });
      products.push({ ...allProds[i]._doc, categoryDetails });
    }
    return res.status(200).send({ products });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.post("/", async (req, res) => {
  const { name, image, categoryId, price, description } = req.body;
  try {
    if (!(name && image && categoryId && price)) {
      return res.status(400).send({ msg: "All fields are required" });
    }
    const rm = await Products.create({
      name,
      image,
      categoryId,
      price,
      description,
    });
    return res.status(201).send({
      msg: "Product registered successfull!",
      product: rm,
    });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.put("/", auth, (req, res) => {
  const { name, categoryId, price, description, _id } = req.body;
  Products.updateOne(
    { _id },
    { name, categoryId, price, description },
    (err, result) => {
      if (err) {
        return res.status(400).send({ msg: err.message });
      } else {
        res.status(200).send({ result, msg: "Product updated successfull!" });
      }
    }
  );
});

router.delete("/:id", auth, (req, res) => {
  const id = req.params["id"];
  Products.deleteOne({ _id: id }, (err, result) => {
    if (err) {
      return res.status(400).send({ msg: err.message });
    } else {
      res.status(200).send({ result });
    }
  });
});

module.exports = router;
