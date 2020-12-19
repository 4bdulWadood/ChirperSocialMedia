const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); //this is required for environment variable access
const path = require("path");
const socket = require('socket.io')
const User = require("./models/userModel");

const app = express();

 //set watch on collection
 const changeStream = User.watch();

app.use(express.json()); //JSON body parser read the JSON body data from express requests
app.use(cors()); //activate cors
app.use(express.static(path.join(__dirname, "./public/")));

const PORT = process.env.PORT || 5000; //if the environment variable doesnt exist run on 5000; FOR HOSTING PURPOSSEs process.env.PORT is used

const server = app.listen(PORT, ()=>{

});

const io = socket(server)

changeStream.on('change', async function(change) {
  if(change.operationType=="update"){
    io.to(socket.id).emit('refresh', await User.findById(change.documentKey._id))
    console.log("changes observed")
      return;
  }

});


app.get('/test', (req,res)=>{
  path.join(__dirname, "./public/")
})
//Set up mongoose
mongoose.connect("mongodb://dbUser:Coolio99@cluster0-shard-00-00.2obqy.mongodb.net:27017,cluster0-shard-00-01.2obqy.mongodb.net:27017,cluster0-shard-00-02.2obqy.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-19oraa-shard-0&authSource=admin&retryWrites=true&w=majority", { //Ideally this string would be an environment variable;
  useNewUrlParser: true, //to avoid warnings
  useUnifiedTopology: true,
  useCreateIndex:true
}, (err) => {
  if(err) throw err;
}
);

// set up routes

app.use("/users", require("./routes/userRouter")); //middleware for authentication

//Serve static files if in production
if(process.env.NODE_ENV === 'production'){
  app.use(express.static('client/build'))
  app.get('*', (req,res)=>{
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  })
}
