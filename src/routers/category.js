const express = require("express");

const { update, addTickets } = require("../controllers/category");
const { controlAdminToken } = require("../middlewares/authorization/auth");

const router = express.Router();

router.put("/", controlAdminToken, update);
router.post("/ticket", controlAdminToken, addTickets);

module.exports = router;