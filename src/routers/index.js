const express = require("express");

const user = require("./user");
const team = require("./team");
const match = require("./match");
const category = require("./category");
const auth = require("./auth");
const admin = require("./admin");

const router = express.Router();

router.use("/user", user);
router.use("/team", team);
router.use("/match", match);
router.use("/category", category);
router.use("/auth", auth);
router.use("/admin", admin);

module.exports = router;