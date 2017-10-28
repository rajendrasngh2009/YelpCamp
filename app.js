var express         =require("express"),
    app             =express(),
    bodyParser      =require("body-parser"),
    mongoose        =require("mongoose"),
    flash           =require("connect-flash"),
    passport        =require("passport"),
    localStrategy   =require("passport-local"),
    methodOverride  =require("method-override"),
    Campground      =require("./models/campground"),
    Comment         =require("./models/comment"),
    User            =require("./models/user");

var commentRoutes    =require("./routes/comments"),
    campgroundRoutes =require("./routes/campgrounds"),
    indexRoutes      =require("./routes/index");


//mongoose.connect("mongodb://localhost/yelp_camp_v12_deployed",{useMongoClient:true});
// to connect to heroku server
mongoose.connect('mongodb://ds040027.mlab.com:40027/yelpcamp',{
                    user:process.env.MONGODBUSER,
                    pass:process.env.MONGODBPASS,
                    useMongoClient:true
                });
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//console.log(__dirname);

// PASSPORT CONFIG----------------------------
app.use(require("express-session")({
    secret:process.env.SECRETCODE,
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// local data will be accessibile any where in the code
app.use(function (req,res,next) {
    res.locals.currentUser  =req.user;
    res.locals.error        =req.flash("error");
    res.locals.success      =req.flash("success");
    next();
});

// requiring routes
app.use("/",indexRoutes);
app.use("/campground",campgroundRoutes);
app.use("/campground/:id/comment",commentRoutes);

app.listen(process.env.PORT,process.env.IP,function() {
    console.log("Yelp Camp Server is started!");
});