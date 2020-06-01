const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route GET   api/profile/me
// @description Get current user's profile
// @access      Private
router.get(
  "/me",
  // auth middleware checks for JWT token
  auth,
  async (req, res) => {
    try {
      //grab the profile document from DB
      const profile = await Profile.findOne({
        user: req.user.id,
      }).populate("user", ["name", "avatar"]);

      //behavior if DB doesn't find the DB entry
      if (!profile) {
        return res.status(400).json({ msg: "No profile for user" });
      }
    } catch (error) {
      //does we only use catch because we are using async?
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
