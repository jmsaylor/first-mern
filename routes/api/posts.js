const express = require("express");
const router = express.Router();

// @route POST   api/posts
// @description register user
// @access      Public
router.post("/", (req, res) => {
  console.log(req.body);
  res.send("Posts Route");
});

module.exports = router;
