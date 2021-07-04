const express = require("express");
// const multer = require("multer");
// const upload = multer({dest:'upload/'});
const app= express();
const morgan = require("morgan");
const {
    getConnection,
    executeQuery
} = require("./utils");

app.use(morgan("dev"));
app.use(express.urlencoded({
    extended: true
}));

//users
app.get("/api/users", function (req,res){

    return res.status(200).send("hello");
});
app.listen(3000, function () {
    console.log('listening on port 3000');
})