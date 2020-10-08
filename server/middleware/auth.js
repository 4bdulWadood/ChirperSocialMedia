const jwt = require("jsonwebtoken");
const auth = (req, res, next) => {
  try{
  const token = req.header("auth-token");
  if(!token){
    return res.status(401).json({msg: "No authentication token, atuhorization denied"});
  }
const verified = jwt.verify(token, process.env.JWT_SECRET); //takes the token from the header and verifies with the secret code created
if(!verified){
  return res.status(401).json({msg: "Token verification failed, authorization denied"});
}
req.user = verified.id;
next();
} catch(err){
    res.status(500).json({error: err.message});
}
};

module.exports = auth;
