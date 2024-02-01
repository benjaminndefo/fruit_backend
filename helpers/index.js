const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const fse = require('fs-extra');

const getMyIp = (req) => {
  return (
    req.socket.remoteAddress |
    req.connection.remoteAddress |
    req.headers["x-forwarded-for"]
  );
};

const verifyToken = (token) => {
  if (!token) {
    return false;
  }
  try {
    return jwt.verify(token, process.env.TOKEN_KEY);
  } catch (err) {
    return false;
  }
};
const toRadians = (degree) => {
  return (degree * Math.PI) / 180;
};
const calCulateDistance = (latitude1, longitude1, latitude2, longitude2) => {
  var R = 6371;
  var deltaLatitude = toRadians(latitude2 - latitude1);
  var deltaLongitude = toRadians(longitude2 - longitude1);
  latitude1 = toRadians(latitude1);
  latitude2 = toRadians(latitude2);
  var a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};

const randomNumber = () => {
  const max = 99999;
  const min = 11111;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

//image uploader
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    const path = "uploads"  
    fse.mkdirsSync(path);  
    cb(null, path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "fruits_and_vegetables_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const uploadImage = multer({ storage: storage });

const cloudnaryImageUpload = async (req) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDNARY_API_KEY,
      api_secret: process.env.CLOUDNARY_API_SECRET,
    });
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto", // or 'image', 'video', etc., based on your requirements
    });

    // Delete the file from the "uploads" directory
    try {
      await fs.promises.unlink(req.file.path);
    } catch (unlinkError) {
      console.error("Error deleting file:", unlinkError);
    }

    return {
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      secure_url: result.secure_url,
    };
  } catch (error) {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (unlinkError) {
      console.error("Error deleting file:", unlinkError);
    }
    throw {
      ...error,
      message:
        "Error while uploading image to cloudinary. Error:" + error.message,
    };
  }
};

module.exports = {
  verifyToken,
  calCulateDistance,
  randomNumber,
  getMyIp,
  cloudnaryImageUpload,
  uploadImage,
};
