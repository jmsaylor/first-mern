const express = require("express");
const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 3000;

//start server
app.listen(PORT, () => console.log(`you got it - listening on ${PORT}`));

//connect to Mongo DB
connectDB();

//Middleware
app.use(express.json({ extended: false }));

//Define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
