const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const isEmpty = require("../../utils/isEmpty");
const { check, validationResult } = require("express-validator");

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
      });

      if (!profile) {
        return res.status(400).json({ msg: "No profile for user" });
      }
      res.send(profile);
    } catch (error) {
      //does we only use catch because we are using async?
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);
// @route GET   api/profile/all
// @description Get all users profiles except the user that requests, and no location data
// @access      Private
router.get("/all", auth, async (req, res) => {
  try {
    const allDocs = await Profile.find({}, { location: 0 });
    allDocs = allDocs.filter((doc) => doc.user !== req.user.id);
    res.send(allDocs);
  } catch (error) {
    console.error(error);
  }
});

// @route       POST api/profile
// @description Create or Update profile
// @access      Private
router.post("/", [auth], async (req, res) => {
  //Does below need to be turned on since no use of express-validator here?
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  //pull fields out from request body
  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin,
  } = req.body;

  //Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    profileFields.skills = skills.split(",").map((skills) => skills.trim());
  }
  //Build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!isEmpty(profile)) {
      //Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    //Create

    profile = new Profile(profileFields);
    //is .create() better now? because of locking
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
