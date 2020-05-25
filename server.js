const express = require("express");
const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`you got it - listening on ${PORT}`));

connectDB();
