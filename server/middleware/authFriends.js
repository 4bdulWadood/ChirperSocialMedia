const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authFriends = (req, res, next) => {
  try{
    const token = req.header("x-auth-token");
    const displayName = req.header("displayName");
    //converts friends token to user.id and checks if the user.id displayName is in followers
    if(!token){
      return res.status(401).json({msg: "No authentication token, atuhorization denied"});
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET); //takes the token from the header and verifies with the secret code created
    if(!verified){
      return res.status(401).json({msg: "Token verification failed, authorization denied"});
    }
    const obj = User.findById(verified.id);
    if(displayName==obj.displayName){
      next();
    }
  } catch(err){
    res.status(500).json({error: err.message});
  }
};

module.exports = authFriends;
