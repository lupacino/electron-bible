const express = require("express");
const router = express.Router();
const indexController = require("../controllers/indexController");

router.get("/", indexController.getIndex);

router.get("/outliers", indexController.getOutLiers);

module.exports = router;
