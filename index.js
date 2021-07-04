const express = require("express");
const morgan = require("morgan");
const fs = require('fs');
const  path = require('path');
const date = require('date-and-time');
const dateFormat = require("dateformat");
let pesan;
morgan.token('date', function (res) {
    let now = dateFormat(new Date(), "dd/MM/yyyy HH:MM");
    return now;
});
morgan.token('message', function (req,res) {
    let psn = pesan;
    return psn;
});
morgan.format("formatku","Method:"+':method; '+"URL:"+':url; '+"Status:"+':status; '
    +"MESSAGE:"+':message; '+"DateTime:"+':date; ' )
const app= express();
const {
    getConnection,
    executeQuery
} = require("./utils");
const accessLogStream = fs.createWriteStream(path.join('./log', '0304.log'), { flags: 'a' });

app.use(morgan("formatku",
    { stream: accessLogStream }));

app.use(express.urlencoded({
    extended: true
}));

//users
app.post("/api/users", async function (req,res){
    let username;
    if(validateUserName(req.body.username)){
        username = req.body.username;
        let query ="SELECT * FROM `users` WHERE `username_user`='"+username+"'";
        let cari = await executeQuery(query);
        if(cari.length<=0){
            username = req.body.username;
        }else{
            pesan ="username sudah pernah di gunakan";
            return res.status(400).send(pesan);
        }
    }else{
        pesan ="username harus kombinasi huruf dan angka";
        return res.status(400).send(pesan);
    }
    let pass= req.body.password;
    let role;
    if(req.body.role_user == "A" || req.body.role_user == "a" ){
        role = 1;
    }else if(req.body.role_user == "U" || req.body.role_user == "u"){
        role = 2;
    }else{
        pesan ="Role A untuk admin dan U untuk user";
        return res.status(400).send(pesan);
    }
    let query= "INSERT INTO `users`(`id_user`, `username_user`, `password`, `role_user`) VALUES ('','"+username+"','"+pass+"'" +
        ",'"+role+"')";
    let hasil = await executeQuery(query);
    if (hasil.err){
        return res.status(404).send(hasil.err);
    }else{
        pesan="berhasil menambahkan user baru";

        return res.status(200).send(pesan);
    }

});

function validateUserName(username){
    let usernameRegex = /^[a-z0-9]{2,10}$/i;
    return usernameRegex.test(username);
}

app.listen(3000, function () {
    console.log('listening on port 3000');
})