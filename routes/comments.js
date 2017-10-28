var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground");
var Comment=require("../models/comment");
var middleware  =require("../middleware");

// COMMENT new
router.get("/new",middleware.isLoggedIn,function(req, res) {
    // find campground id
    Campground.findById(req.params.id,function (err,campground) {
        if(err){
            console.log(err);
        } else {
            res.render("comment/new",{campground:campground}); 
        }
    })
   
});
// comment create
router.post("/",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function (err,campground) {
        if(err){
            console.log(err);
            res.redirect("/campground");
        } else {
            Comment.create(req.body.comment,function (err,comment) {
                if(err){
                    req.flash("error","Something went wrong!");
                    console.log(err);
                } else {
                    // add username and id to comment
                    comment.author.id= req.user._id;
                    comment.author.username= req.user.username;
                    // save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success","Successfully added comment");
                    res.redirect("/campground/"+ campground._id); 
                }
            })
        }
    })
});
// comment Edit form 

router.get("/:comment_id/edit",middleware.checkCommentOwnership,function (req,res) {
    Comment.findById(req.params.comment_id,function(err, foundComment) {
        if(err){
           res.redirect("back");
        } else {
            res.render("comment/edit",{campground_id:req.params.id,comment:foundComment}); 
        }
    });
});
// comment update  

router.put("/:comment_id",middleware.checkCommentOwnership,function (req,res) {
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,
    function (err,updatedComment) {
        if(err){
            res.redirect("back");
        } else {
            req.flash("success","Comment updated.");
             res.redirect("/campground/"+req.params.id);  
        }
    });
});
// DESTROY / DELETE comment ROUTE
router.delete("/:comment_id",middleware.checkCommentOwnership,function (req,res) {
    Comment.findByIdAndRemove(req.params.comment_id,function (err) {
       if(err){
            res.redirect("back");
        } else {
             req.flash("success","Comment deleted.");
            res.redirect("/campground/"+req.params.id);  
        }
    });
});

module.exports=router;