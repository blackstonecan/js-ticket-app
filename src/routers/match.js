const express = require("express");

const { create, get, update, addCategory, getAll } = require("../controllers/match");
const { controlAdminToken, controlMD5 } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/", controlAdminToken, create);
router.get("/", controlMD5, getAll);
router.get("/:id", controlMD5, get);
router.put("/", controlAdminToken, update);

router.post("/category", controlAdminToken, addCategory);

module.exports = router;