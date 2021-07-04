const morgan = require("morgan");
const express = require("express");
const app= express();
const {
    getConnection,
    executeQuery
} = require("./utils");

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));



app.listen(3000, function () {
    console.log('listening on port 3000');
})