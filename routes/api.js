const express = require("express");
const router = express.Router();

const pi_controller = require("../controllers/piController");

router.post("/links/", pi_controller.link_create_postMethod);

module.exports = router;
