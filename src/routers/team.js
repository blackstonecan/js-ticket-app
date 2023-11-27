const express = require("express");

const { create, get, remove } = require("../controllers/team");
const { controlAdminToken, controlMD5 } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/", controlAdminToken, create);
router.get("/:id", controlMD5, get);
router.delete("/:id", controlAdminToken, remove);

module.exports = router;