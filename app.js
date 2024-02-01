require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "50mb" }));

app.use(cors());

//home route
app.get("/", (req, res) => {
  res.send(`
  <h1>Fruits & Vegetables Online Market</h1>
  `);
});

const usersRoute = require("./routes/users");
const cartRoute = require("./routes/cart");
const productCategoriesRoute = require("./routes/productCategories");
const productsRoute = require("./routes/products");
const deliveryFeesRoute = require("./routes/deliveryFees");
const ordersRoute = require("./routes/orders");
app.use("/api/users/", usersRoute);
app.use("/api/cart/", cartRoute);
app.use("/api/categories/", productCategoriesRoute);
app.use("/api/products/", productsRoute);
app.use("/api/deliveryfees/", deliveryFeesRoute);
app.use("/api/orders/", ordersRoute);

//404 route
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "The page does not exist on the server.",
    },
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
