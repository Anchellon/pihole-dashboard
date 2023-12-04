const express = require("express");
// let cors = require("cors");
const app = express();
const port = 3000;
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
// Connection to db via mongoose
// const conn = require("./utils/connection");
// Adding routers

// var usersRouter = require("./routes/users");
const api = require("./routes/api");

// Middlewares
// app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Adding routes
// app.use("/users", usersRouter);
app.use("/api", api);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
