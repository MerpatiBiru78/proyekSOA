// import
const express = require("express");
const morgan = require("morgan");
const fs = require('fs');
const  path = require('path');
const dateFormat = require("dateformat");
const jwt = require('jsonwebtoken');
const multer= require('multer');
const port = process.env.PORT || 3000;
// Create multer object
let id_team;
const upload = multer({
    storage: multer.diskStorage(
        {
            destination: function (req, file, cb) {
                cb(null, 'public/uploads');
            },
            filename: function (req, file, cb) {
                cb(
                    null,
                    file.originalname
                );
            }
        }
    ),
});
// morgan format
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
    +"MESSAGE:"+':message; '+"DateTime:"+':date; ' );

const app= express();
const {
    getConnection,
    executeQuery
} = require("./utils");

// logStream
const accessLogStream = fs.createWriteStream(path.join('./log', '0304.log'), { flags: 'a' });
app.use(morgan("formatku",
    { stream: accessLogStream }));

app.use(express.urlencoded({
    extended: true
}));

// users
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
            return res.status(404).send(pesan);
        }
    }else{
        pesan ="username harus kombinasi huruf dan angka";
        return res.status(404).send(pesan);
    }
    let pass= req.body.password;
    let role;
    if(req.body.role_user == "A" || req.body.role_user == "a" ){
        role = 'Admin';
    }else if(req.body.role_user == "U" || req.body.role_user == "u"){
        role = 'Users';
    }else{
        pesan ="Role A untuk admin dan U untuk user";
        return res.status(404).send(pesan);
    }
    let query= "INSERT INTO `users`(`id_user`, `username_user`, `password`, `role_user`) VALUES ('','"+username+"','"+pass+"'" +
        ",'"+role+"')";
    let hasil = await executeQuery(query);
    if (hasil.err){
        pesan=hasil.err;
        return res.status(404).send(hasil.err);
    }else{
        let query ="Select `username_user`, `role_user` from `users` where `username_user` like '%"+username+"%' and `password` = '"+pass+"'";
        let ambil = await  executeQuery(query);
        if(ambil.length>=1){
            pesan="berhasil menambahkan user baru";
            return res.status(200).send(ambil);
        }else{
            pesan="tidak berhasil menambahkan user baru";
            return res.status(500).send(pesan);
        }

    }

});
app.post("/api/users/login", async function (req,res){
    let user = req.body.username;
    let pass =req.body.password;
    let query = "select users.username_user as 'user',users.id_user as 'id',users.role_user as 'role' from users where username_user like '"+user+"' and password = '"+pass+"'";
    let hasil = await executeQuery(query);
    if(hasil.length>=1){
        const token = jwt.sign({ id: hasil[0]["id"], username: hasil[0]["user"], role: hasil[0]["role"] }
            , 'private_key');
        let query ="INSERT INTO `token`(`id_token`, `username`, `jwt_key`) VALUES ('','"+hasil[0]["user"]+"'" +
            ",'"+token+"')";
        let insertToken = await executeQuery(query);
        if(insertToken.err){
            pesan=insertToken.err;
            return res.status(404).send(insertToken.err);
        }else{
            let query = "SELECT username,jwt_key FROM `token` WHERE jwt_key='"+token+"' and username='"+hasil[0]["user"]+"'";
            let ambilToken= await executeQuery(query);
            if (ambilToken.length>0){
                pesan="Berhasil melakukan login";
                return res.status(200).send(ambilToken);
            }else{
                pesan=ambilToken.err;
                return res.status(200).send(ambilToken.err);
            }
        }
    }else{
        pesan=hasil.err;
        return res.status(404).send("pastikan username dan password benar");
    }
});
// teams
app.post('/api/teams', upload.single('logo_team'), async function (req, res,next){
    let query="SELECT users.role_user FROM `token`,`users` where users.username_user = token.username " +
        "and token.jwt_key ='"+req.body.authorization+"'";
    let cek= await  executeQuery(query);
    if(cek.length>0 && cek[0]['role_user']=='Admin'){
        let nowYear = dateFormat(new Date(), "yyyy");
        if(req.body.tahun_ditemukan_team>nowYear){
            pesan="Tahun tidak sesuai"
            return res.status(404).send(pesan);
        }
        let id_team = req.body.nama_team.substr(0,2).toUpperCase();
        let Newpath;
        let checkId= await executeQuery("select id_team from teams where id_team like '"+id_team+"%' " +
            "order by id_team desc");
        if(checkId.length>0){
            let lastId= checkId[0]["id_team"].substr(3,3)*1+1;
            lastId = ('0000'+lastId).slice(-3);
            id_team = id_team+lastId;
            let Oldpath =req.file.path;
            Newpath = 'public/uploads/' + id_team + '.jpg';
            fs.rename(Oldpath, Newpath, function(err) {
                if ( err ) console.log('ERROR: ' + err);
            });
        }else{
            id_team=id_team +"001";
            let Oldpath =req.file.path;
            Newpath = 'public/uploads/' + id_team + '.jpg';
            fs.rename(Oldpath, Newpath, function(err) {
                if ( err ) console.log('ERROR: ' + err);
            });
        }
        let insertTeam = await executeQuery("INSERT INTO `teams`(`id_team`, `nama_team`, `nama_stadio_team`, `tahun_ditemukan_team`, `logo_team`) " +
            "VALUES ('"+id_team+"','"+req.body.nama_team+"'," +
            "'"+req.body.nama_stadion+"','"+req.body.tahun_ditemukan_team+"','"+Newpath+"')");
        if(insertTeam.err){
            return res.status(500).send(insertTeam.err);
        }else{
            pesan="Berhasil menambahkan team";
            let selectTeam=await executeQuery("SELECT * FROM `teams` WHERE id_team='"+id_team+"'");
            return res.status(200).send(selectTeam);
        }
    }else{
        pesan="Unauthorized";
        return res.status(500).send(pesan);
    }

});
//match

function validateUserName(username){
    let usernameRegex = /^[a-z0-9]{2,10}$/i;
    return usernameRegex.test(username);
}

app.listen(3000, function () {
    console.log('listening on port 3000');
})