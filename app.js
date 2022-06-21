require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

// For time-stamp in chat.

function timestamp() {
    let d = new Date();
    let ISTTime = new Date(new Date().getTime() + (330 + d.getTimezoneOffset())*60000);
    let timeStamp = `[${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][ISTTime.getDay()]} ${ISTTime.getHours() % 12 || 12}:${ISTTime.getMinutes()} ${ISTTime.getHours()>=12?"PM":"AM"}]`
    return timeStamp;
}


app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect(`mongodb+srv://admin_subhranshu:${process.env.DB_KEY}@cluster0.one0j.mongodb.net/anonymousChat`);

const userSkeliton = new mongoose.Schema({
    email: String,
    password: String
}); // schema

const roomSchema = new mongoose.Schema({
    roomname: String,
    password: String,
    messages: [String],
    
});


userSkeliton.plugin(passportLocalMongoose);


const Room = new mongoose.model("room",roomSchema);
const User = new mongoose.model("user",userSkeliton);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home");
});

app.use((req, res, next) => { res.header({"Access-Control-Allow-Origin": "*"}); next(); })

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/room",(req,res)=>{
    
    if(req.isAuthenticated()){
        res.render("room",{username:req.user.username});
    }else{
        res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
            res.send("Something went wrong! Kindy retry or conatct subhranshu choudhury.")
        }else{
    res.redirect("/");

        }
    });
});

app.post("/register",(req,res)=>{
  
    User.register({username: req.body.username},req.body.password,(err,u)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/room");
            });
        }
    });

    
});

app.post("/login",(req,res)=>{
   const user = new User({
    username:req.body.username,
    password:req.body.password
   });

   req.login(user,(err)=>{
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,()=>{
            res.redirect("/room");
        });
    }
   });
    
});

// ROOM ########################

app.get("/create-room",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("create-room");
    }else{
        res.redirect("/login");
    }
})

app.post("/create-room",(req,res)=>{
    const newRoom = new Room({
        roomname: req.body.roomname,
        password: req.body.password
    });

    newRoom.save((err)=>{
        if(err){
            res.send(err);
        }else{
            res.redirect("/join-room");
        }

    });
});



app.get("/chat/:roomName/:roomPassword",(req,res)=>{
    if(req.isAuthenticated()){
        Room.findOne({roomname:req.params.roomName,password:req.params.roomPassword},(err,message)=>{
            if(message){
                const userMessage = message.messages;
                res.render("chat",{roomName:req.params.roomName,roomPassword:req.params.roomPassword,userMessage:userMessage});
    
            }else{
                if(err){
                    res.send(err);
                }else{
                    res.send("/room");
                }
            }
        });
        
    }else{
        res.redirect("/login");
    }
});

app.post("/chat/:roomName/:roomPassword",(req,res)=>{

    if(req.isAuthenticated()){
        const message = req.body.message;
        const username = req.user.username;
        Room.updateOne({roomname:req.params.roomName,password:req.params.roomPassword},{$push: { messages: `${timestamp()} ${username}: ${message}` }},(err)=>{
           if(err){
               res.send(err);
           }else{
               res.redirect(`/chat/${req.params.roomName}/${req.params.roomPassword}`);
           }
       });
    }else{
        res.redirect("/login");
    }

    
});

app.get("/join-room",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("join-room");
    }else{
        res.redirect("login");
    }
});

app.post("/join-room",(req,res)=>{
    if(req.isAuthenticated()){
        const roomname = req.body.roomname;
        const password = req.body.password;
        Room.findOne({roomname: roomname,password:password},(err,foundRoom)=>{
            if(foundRoom){
                res.redirect(`/chat/${roomname}/${password}`);

            }else{
                if(err){
                    res.send(err);
                }else{
                    res.redirect("/join-room");
                }
            }
        });

        ;
    }else{
        res.redirect("login");
    }
});

app.get("/messages/:roomName/:roomPassword",(req,res)=>{
    const roomName = req.params.roomName;
    const roomPassword = req.params.roomPassword;
    
    Room.findOne({roomname:roomName,password:roomPassword},(err,message)=>{
        if(message){
            res.send(message.messages);

        }else{
            if(err){
                res.send(err);
            }else{
                res.send("No room matched.");
            }
        }
    });
});


app.listen(process.env.PORT || 3000,()=>{
    console.log("===> Live at port 3000")
});