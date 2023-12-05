const express = require("express");
const router = express.Router();

const piController = require("../controllers/piController");

router.post("/links/", piController.link_create_postMethod);
// router.get("/links/", pi_controller.link_create_postMethod2);
router.post("/toggle-internet/", piController.toggle_internet);

router.post("/focus-mode/", piController.focusMode);
module.exports = router;
