const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route GET   api/users
// @description Post user
// @access      Public

// @route POST   api/users
// @description Post user
// @access      Public
router.post(
  "/",
  [
    //middleware is an array of express-validator calls
    check("name", "Make sure to add your name").not().isEmpty(),
    check("email", "Please add your email").isEmail(),
    check("password", "mininum 6 characters for password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      // See if user exists
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ errors: [{ msg: "user exists" }] });
      }
      // Get users pfp
      const avatar = await gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });
      // create a new Mongo User instance
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10); //is the salt only kept server-side?

      user.password = await bcrypt.hash(password, salt); //the hash call

      await user.save();
      // we send back a JWT token in /api/auth as well, why the two?
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 }, //<---number different in production
        (err, token) => {
          if (err) throw err;
          res.json({ token }); //<---
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("server error");
    }
  }
);

module.exports = router;
