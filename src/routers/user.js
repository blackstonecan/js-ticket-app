const express = require("express");

const { create, get, remove, buyTicket, sellTicket } = require("../controllers/user");
const { controlMD5, controlUserToken } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/", controlMD5, create);
router.get("/:id", controlUserToken, get);
router.delete("/:id", controlUserToken, remove);

router.put("/buy", controlUserToken, buyTicket);
router.put("/sell", controlUserToken, sellTicket);

module.exports = router;