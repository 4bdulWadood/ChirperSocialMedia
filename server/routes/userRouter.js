const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const express = require('express');
const multer = require('multer');
const path = require("path");
const moment = require("moment");

//join the connecting user to a new room socket.join(displayName) on logout socket.leave(displayName)
//send back the users feed through room io.to(displayName).emit
//socket leave on logout

//Save user images' unique image_url

router.post("/edits", auth, async(req,res)=>{
  try{
    const user = await User.findById(req.user)
    const {displayName, email, bio} = req.body
    if(displayName){
      user.displayName = displayName
    }
    if(email){
    user.email = email
    }
    if(bio){
      user.Bio = bio
    }
    await user.save()
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
})

router.post("/upload", auth, async(req,res)=>{
  try{
    const user = await User.findById(req.user);
    user.image = req.header("image_url");
    await user.save();
    res.json(user.image)
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

router.get("/getImage", async(req, res)=>{
  try{
      const user = await User.findOne({displayName: req.header("searchedname")});
      const userlink = await User.find({"displayName":user.displayName});
      res.json({
        image_url: userlink.map(val=> {return val.image})
      });
  }
  catch(err){res.status(500).json({error:err.message});}
});

router.post("/register", async (req, res) => {
  //express.json() automatically parses the body
  //async function for saving onto Mongo
  try{
  let {email, password, passwordCheck, displayName, bday} = req.body; //destructuring

  //validate
  if(!email || !password || !passwordCheck || !displayName || !bday){
    //send back bad request error
    return res.status(400).json({msg: "not all fields have been entered"}); }

    if(password.length < 5)
      return res.status(400).json({msg: "The password needs to be at least 5 characters long."});

    if(password !== passwordCheck){
      return res.status(400).json({msg: "Enter the same password twice!"});
    }
    //Trying to find an email property of the email object
    const existingUser = await User.findOne({email}) || await User.findOne({displayName}); //accessing User model gives us a promise therefore need an await; returns an object .find returns an array
    if(existingUser){
      return res.status(400).json({msg: "An account with this user already exists!."});
    }

    if(!displayName){
      displayName = email;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: passwordHash,
      displayName,
      bday,
      messages: [],
      followers: [],
      following: [],
      Bio: " "
    });

    const savedUser = await newUser.save();
    res.json(savedUser);
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
});


router.post("/login", async (req, res) => {
  try{
    //the email and password specified in the body of the request
    const {email, password} = req.body;

    if(!email || !password)
        return res.status(400).json({msg: "Not all fields have been entered!"});

    const user = await User.findOne({email: email});
    if(!user)
        return res.status(400).json({msg: "No user with specified email"});

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({msg: "Invalid credentials!"});
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET); //stores logged in user
    res.json({ //respond with JSON
      token,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        bday: user.bday,
        messages: user.messages,
        followers: user.followers,
        following: user.following,
        bio: user.Bio
      }
    });
    //post log in we need to create private routes that can only be accessed post authentication
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
});

router.post("/addMsg", auth, async(req, res) => { //need authentication for this
    try{
     const m = req.header("message");
     //appends all followers "messages" array
     //add the users username and date to the end of the message
     //some message username dd/mm/yyyy

      const user = await User.findById(req.user);
      const message = m.concat(" ",user.displayName," ", moment().format("MMMDDYYYY"))
      const arr = user.followers;
      arr.forEach(async (item) => {
        const user1 = await User.findOne({displayName: item});
        user1.messages.unshift(message);
        await user1.save();
      });
      user.messages.unshift(message);
      const savedUser = await user.save();
      res.json(savedUser);
    }
    catch(err){
      res.status(500).json({error:err.message});
    }
});

router.get("/getUsers", auth, async(req, res)=>{
  try{
    //req.nameSearched
    //.find document with particular name
      const users = await User.findOne( { displayName: req.header("searchedname") } );
      res.json({
        displayNames: users.displayName
      });
  }
  catch(err){res.status(500).json({error:err.message});}
});


router.get("/getMsgs", auth, async(req, res) => {
    try{
      //making sure only the user or the users followers have access to messages
      const user1 = await User.findOne({displayName: req.header("displayName")});
      const user2 = await User.findById(req.user);
      if(user1.displayName === user2.displayName || user1.followers.includes(user2.displayName)){ //return messages only if the user making the request is requesting his own messages. or if the user making the request is currently following the person he'
        res.json({
          messages: user1.messages
        });
      }
    }
    catch(err){
      res.status(500).json({error:err.message});
    }
});

router.get("/getRecommended", auth, async(req,res)=>{
  var network, friends;
    try{
      await User.aggregate([
        { $match: { "displayName": req.header("displayName") } },
      {
        $graphLookup: {
          from: "users", // Use the Users collection
          startWith: "$following", //consider the following property
          connectFromField: "following", // links between users are represented by the following property;
          connectToField: "displayName", // ... pointing to another users displayName
          maxDepth: 1, //only following + their following
          as: "socialNetwork",
        }
      },
      {
        $project: {socialNetwork: "$socialNetwork.displayName"}
      }
    ]).then(res=> {network = res[0].socialNetwork});

    await User.aggregate([
    { $match: { "displayName": req.header("displayName") } },
  {
    $graphLookup: {
      from: "users", // Use the Users collection
      startWith: "$following", //consider the following property
      connectFromField: "following", // links between users are represented by the following property;
      connectToField: "displayName", // ... pointing to another users displayName
      maxDepth: 0, //only following
      as: "socialNetwork",
    }
  },
  {
    $project: {socialNetwork: "$socialNetwork.displayName"}
  }
]).then(resp=> {
  friends = resp[0].socialNetwork;
  var rec = network.filter(n=>!friends.includes(n)); //remove the users current following from their network to show recommended follows
  function shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
      }
  }
  shuffleArray(rec);
  var send=[];
  function return5(array){
    array.forEach((item, i) => {i<5&&item!=req.header("displayName")?send.push(item):null});
  }

  return5(rec);
  res.json(send);
  });
        }
        catch(err){
          res.status(500).json({error: err.message});
        }
  });

  router.get("/following", auth, async(req, res)=>{
    try{
      const user = await User.findById(req.user);
      const userlinks = await User.find({"displayName":user.following})
      const following = userlinks.map((val)=>{return {displayName: val.displayName, image: val.image}})
      res.json(following);
    }
    catch(err){res.status(500).json({error:err.message});}
  });

  router.get("/followers", auth, async(req, res)=>{
    try{
        const user = await User.findById(req.user);
        const userlinks = await User.find({"displayName":user.followers})
        const followers = userlinks.map((val)=>{return {displayName: val.displayName, image: val.image}})
        res.json(followers);
    }
    catch(err){res.status(500).json({error:err.message});}
  });

router.post("/following", async(req, res) => {
  try{
    const followed = await User.findOne({displayName: req.header("followed")});
    const follower = await User.findOne({displayName: req.header("follower")});
    if(!followed.followers.includes(follower.displayName)){
    followed.followers.unshift(follower.displayName);
    follower.following.unshift(followed.displayName);
    }
    await followed.save();
    await follower.save();
    res.json(follower);
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

router.post("/unfollowing", async(req, res) => {
  try{
    const followed = await User.findOne({displayName: req.header("followed")});
    const follower = await User.findOne({displayName: req.header("follower")});
    if(followed.followers.includes(follower.displayName)){
    followed.followers=followed.followers.filter(function(item) {return item !== follower.displayName})
    follower.following=follower.following.filter(function(item) {return item !== followed.displayName})
    }
    await followed.save();
    await follower.save();
    res.json(follower);
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

router.delete("/delete", auth,  async(req, res)=> { //runs auth middleware first to verify token and set req.user to verfied.id, then runs the async function to delete account with user.id
  try{
    const deletedUser = await User.findByIdAndDelete(req.user);
    res.json(deletedUser);
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

router.get("/", auth, async (req,res)=> {
  const user = await User.findById(req.user);
  res.json({
    displayName: user.displayName,
    id: user._id,
    following: user.following
  });
});

router.post("/tokenIsValid", async(req, res)=> {
  try{
    const token = req.header("auth-token");
    if(!token){
      return res.json(false);
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(!verified) return res.json(false);
    const user = await User.findById(verified.id);
    if(!user){
      return res.json(false);
    }
    return res.json(true);
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
});

router.post("/update", async(req, res)=>{
  try{
      const user = await User.findOne({displayName: req.header("searchedname")});
      const {Bio, UpdateUsername, UpdateEmail} = req.body;

      if(UpdateUsername){
        var newvalues = { $set: { displayName: UpdateUsername } };
        await User.updateOne(req.user, newvalues)
      }

      if(UpdateEmail){
        var newvalues = { $set: { UpdateEmail } };
        await User.updateOne(req.user, newvalues)
      }

      if(Bio){
        var newvalues = { $set: { Bio } };
        await User.updateOne(req.user, newvalues)
      }

      await user.save()
      return res.json(true);
  }catch(err){
    res.status(500).json({error: err.message})
  }

})

module.exports = router;
