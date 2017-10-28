var express     =require("express");
var router      =express.Router();
var Campground  =require("../models/campground");
var middleware  =require("../middleware");
// root route
router.get("/",function (req,res) {
    //get data from db
    Campground.find({},function (err,allCampgrounds) {
        if(err){
            console.log(err);
        } else {
           res.render("campground/campground",{campground:allCampgrounds});
        }
    });
});
// register form route
router.post("/",middleware.isLoggedIn,function(req,res){
    var name=req.body.name;
    var price=req.body.price;
    var image=req.body.image;
    var desc=req.body.description;
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var newCampground={name:name,price:price,image:image,description:desc,author:author};
  // create new campground and store to DB
   Campground.create(newCampground,function (err,newlyCreated) {
            if(err){
                console.log(err);
            } else{
                res.redirect("/campground");
            }
        });
});
router.get("/new",middleware.isLoggedIn,function (req,res) {
    res.render("campground/new");
});

router.get("/:id",function (req,res) {
    // to display searched campground
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCamp){
        if(err){
                console.log(err);
            } else{
                res.render("campground/show",{campground:foundCamp});
            }
    });
});
// EDIT CAMPGROUND
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
    Campground.findById(req.params.id,function (err,foundCampground) {
        res.render("campground/edit",{campground:foundCampground});   
    });
});
// UPDATE CAMPGROUND
router.put("/:id",middleware.checkCampgroundOwnership,function (req,res) {
    Campground.findByIdAndUpdate(req.params.id,req.body.campground,
        function (err,updatedCampground) {
            if(err){
                res.redirect("/campground");
            } else {
                 res.redirect("/campground/"+req.params.id);  
            }
    });
});

// DESTROY / DELETE CAMPGROUND ROUTE
router.delete("/:id/",middleware.checkCampgroundOwnership,function (req,res) {
    Campground.findByIdAndRemove(req.params.id,function (err) {
       if(err){
            res.redirect("/campground");
        } else {
            res.redirect("/campground");  
        }
    });
});

module.exports=router;

