const express = require("express");

const { login, isLogged } = require("../controllers/auth");
const { controlMD5 } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/login", controlMD5, login);
router.post("/islogged", controlMD5, isLogged);

module.exports = router;
