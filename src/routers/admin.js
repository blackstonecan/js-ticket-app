const express = require("express");

const { create, get, remove, login } = require("../controllers/admin");
const { controlMD5, controlAdminToken } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/", controlMD5, create);
router.get("/:id", controlAdminToken, get);
router.delete("/:id", controlAdminToken, remove);
router.post("/login", controlMD5, login);

module.exports = router;