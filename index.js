const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const app = express();

// middleware
app.use(express.static(path.join(path.resolve(), "public"))); // access defalut files
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// data base connection
mongoose
    .connect("mongodb://127.0.0.1:27017/user")
    .then(() => {
        console.log("server is connected ");
    })
    .catch((err) => {
        console.log("err", err);
    });

// schema / model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

// access the ejs file
app.set("view engine", "ejs");

// middleware function
const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "wertyui");

        req.user = await User.findById(decoded._id);

        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user)
    res.render("logout",{email: req.body.email});
});


app.get('/register',(req,res) => {
    res.render('register')
})

app.get('/login',(req,res) => {
    res.render('login')
})


app.post("/register", async (req, res) => {
    console.log(req.body)
    const { name,email,password } = req.body;

    let user = await User.findOne({email});
    if(user){
        return res.redirect('/login');
    }

    const hashedpassword = await bcrypt.hash(password,10);

     user = await User.create({
        name,
        email,
        password:hashedpassword
    });

    const token = jwt.sign({ _id: user.id }, "wertyui")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/");
});


app.post('/login', async(req,res) => {
    const{email,password} = req.body

    let user = await User.findOne({email})

    if(!user) return res.redirect('/register')

    const isMatch = await bcrypt.compare(password , user.password);

    if(!isMatch) return res.render('login',{email,message: 'Incorrect Password'})

    const token = jwt.sign({ _id: user.id }, "wertyui")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/");
})


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

app.listen(1000, () => {
    console.log("server is connected");
});
