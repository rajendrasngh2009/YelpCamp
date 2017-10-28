var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user");
var middleware  =require("../middleware");
var nodemailer  =require("nodemailer");
var crypto      = require('crypto');
//-----------------------------------------------
router.get("/",function (req,res) {
    res.render("landing");
});



//===================
// AUTH ROUTES
//===================
// show register form
router.get("/register",function(req, res) {
    res.render("register");
});
// handle sign up logic
router.post("/register",function(req, res) {
    var newUser=new User({username:req.body.username,email:req.body.email});
    User.register(newUser,req.body.password,function (err,user) {
        if(err){
            console.log(err.message);
           req.flash("error",err.message);
           return  res.redirect("back");
        } else {
            passport.authenticate("local")(req,res,function() {
                req.flash("success","Welcome to YelpCamp " + user.username);
                res.redirect("/campground")
            });
        }
    });
});
//==========================
// Login Logic
//==========================
// show login form
router.get("/login",function(req, res) {
    res.render("login");
});
// login verify and redirect
router.post("/login",passport.authenticate("local",
        {
            successRedirect:"/campground",
            failureRedirect:"/login"
    }),function(req, res) {
        
});

//==========================
// Log out Logic
//==========================
router.get("/logout",function(req, res) {
    req.logout();
    req.flash("success","Logged you out!");
    res.redirect("/campground");
});

//==========================
// Change password Logic
//==========================
router.get("/changePassword",middleware.isLoggedIn,function(req, res) {
    res.render("changePassword");
});

router.post("/changePassword",middleware.isLoggedIn,function(req, res) {
   // console.log(req.body.oldPassword);
   // console.log(req.body.newPassword);
    var oldPassword     =req.body.oldPassword;
    var newPassword     =req.body.newPassword;
    var confirmPassword =req.body.confirmPassword;
    if(oldPassword =='' || newPassword =='' || confirmPassword ==''){
        req.flash("error","Old / New / Confrim password field should not be empty!");
        return res.redirect("back"); 
    } else {
        User.findById(req.user._id,function(err,foundUser){
            if(!foundUser){
                req.flash("error","User Not Found!");
                return res.redirect("back");
            } 
             if(newPassword === confirmPassword){
                foundUser.changePassword(oldPassword,newPassword,function(err){
                    if(err){
                       req.flash("error","Old password is not correct!"); 
                       return res.redirect("back");
                    } else {
                        req.flash("success","Password Changed successfully!"); 
                        return res.redirect("/campground");
                    }
                })
             } else {
                req.flash("error","Password do not match!");
                 return res.redirect("back");
            }
        });  
    }
});
//==========================
// Forgot password Logic
//==========================
router.get("/forgotPassword",function(req, res) {
    res.render("forgotPassword");
});
// token generation and link send by mail to reset password
router.post("/forgotPassword",function(req, res) {
    User.findOne({email:req.body.email},function(err,userData){
       if(!userData){
            req.flash("error","No account with that email address exists!");
            return res.redirect("back");
       } else {
           // generate random token
           crypto.randomBytes(20,function(err,buf){
               var tokenData=buf.toString('hex');
               var tokenExpireData=Date.now() + 3600000;
               if(tokenData){
                   userData.resetPassToken=tokenData;
                   userData.resetPassExpires=tokenExpireData;
                   userData.save(function(err){
                       if(!err){
                            var smtpTransport= nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true, // use SSL
                                auth: {
                                    user: process.env.GMAILUSER,
                                    pass: process.env.GMAILPASS
                                }
                            });
                            var mailOptions={
                                to:userData.email,
                                from:'nodeForgotPassword@gmail.com',
                                subject: 'Password Reset link',
                                text:'Click below link to reset password! \n' + 'https://'+ req.headers.host + '/reset/' + tokenData + '\n\n' 
                            };
                           //console.log(mailOptions);
                            smtpTransport.sendMail(mailOptions,function(err){
                                if(!err){
                                    console.log("mail Sent");
                                    req.flash("success","A mail has been sent to " + userData.email + " with further instruction to reset password!");
                                    return res.redirect("back");  
                                } else {
                                    console.log(err);
                                    console.log("issue mail Sent");
                                }

                            });
                       } else {
                        console.log("data not saved");
                       }
                   });
               }
           })
       }
    });
});

router.get("/reset/:token",function(req, res) {
     User.findOne({resetPassToken:req.params.token,resetPassExpires:{$gt: Date.now() }},function(err,userData){
        if(!userData){
            req.flash("error","Password reset token is invalid or has expired!");
            return res.redirect("/forgotPassword");  
        } 
        res.render("reset",{token:req.params.token});
        
     });
   
});

router.post("/reset/:token",function(req, res) {
     User.findOne({resetPassToken:req.params.token,resetPassExpires:{$gt: Date.now() }},function(err,userData){
        if(!userData){
            req.flash("error","Password reset token is invalid or has expired!");
            return res.redirect("/forgotPassword");  
        } 
        if(req.body.newPassword === req.body.confirmPassword){
                userData.setPassword(req.body.newPassword,function(err){
                   userData.resetPassToken=undefined;
                   userData.resetPassExpires=undefined;
                   userData.save(function(err){
                       if(!err){
                            req.flash("success"," New Password has been created successfully. Please login with new password!");
                            return res.redirect("/login");  
                       }
                   })
                });
        } else {
            req.flash("error","Password do not match!");
            return res.redirect("back");
        }
     });
});
module.exports=router;