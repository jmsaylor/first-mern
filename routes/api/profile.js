const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const isEmpty = require("../../utils/isEmpty");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");

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
    let allDocs = await Profile.find({}, { location: 0 });
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

// @route   DELETE api/profile
// @description DELETE current user profile and user docs
// @access      Private
router.delete("/", auth, async (req, res) => {
  try {
    //@todo remove all posts from user?

    //Remove proile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Remvoe user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "user deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
});

// @route   PUT api/profile/experience
// @description Add an experience to profile
// @access      Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).send("server error");
    }
  }
);

// @route   DELETE api/profile/experience
//description DELETE one experience
//access      Private
router.delete("/experience/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    //Remove experience
    //isn't properly identifying experience id
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
});

// @route   PUT api/profile/education
// @description Add an education to profile
// @access      Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of Study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).send("server error");
    }
  }
);

// @route   DELETE api/profile/education
// @description DELETE one education
// @access      Private
router.delete("/education/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    //Remove education
    //isn't properly identifying education id
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
});

// @route   GET api/profile/github/:username
// @description GET repo list
// @access      Public
router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: {
        "user-agent": "node-js",
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "User not found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
});

module.exports = router;
