const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
  email: {type: String, required: true},
  password: {type: String, required: true, minlength: 5},
  displayName: {type: String, required: true}, 
  bday: { type: String, required: true },
  image: { type: String, required: false },
  Bio: { type: String, required: false },
  messages: [{
    type: String, required: false
  }],
  followers: [{
    type: String, required: false
  }],
  following: [{
    type: String, required: false
  }]
});

module.exports = User = mongoose.model("user", userSchema);
