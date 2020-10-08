import React, {useState, useEffect, useContext} from 'react';
import { Button, TextField } from '@material-ui/core';
import Axios from 'axios';
import UserContext from '../../../context/UserContext';

export default function Feed(){
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { userData } = useContext(UserContext);

  useEffect(() => {
  const checkHomePage = async() => {
    try{
      //use Context to obtain the user info
      //get the token from the header
      //make a get request to obtain Messages
      let token = localStorage.getItem("auth-token"); //check if there is already a user logged in
      if(token === null){ //if not then set an auth-token variable to empty string
        localStorage.setItem("auth-token", "");
        token = "";
      }

      const tokenRes = await Axios.post("http://localhost:5000/users/tokenIsValid", null, {headers: { "auth-token": token }});
      if(tokenRes.data){
        const user = await Axios.get("http://localhost:5000/users/", {headers: {"auth-token": token}});
        const messages = await Axios.get("http://localhost:5000/users/getMsgs", {headers: { "auth-token": token, "displayName": user.data.displayName }});
        setMessages(messages.data.messages);
    }
    }catch(err){}
  }
  checkHomePage();
},messages); //refresh list whenever messages array is appended

  const SendMessage = async(e) => {
    e.preventDefault();
    try{
      localStorage.setItem("message", message);
      let m = localStorage.getItem("message");
      let token = localStorage.getItem("auth-token");
      const user = await Axios.post("http://localhost:5000/users/addMsg", null, {headers: { "auth-token": token, "message": m }}); //header includes token & message
      setMessages(user.data.messages);
      console.log(messages);
    }
    catch(err){
    }
  }

  return (
    <div className="home-feed">
      <div className="home-feed-text"> My Feed </div>
      <div className="sizing">
      <TextField
        id="filled-multiline-static"
        label="What's Up?"
        multiline
        rows={4}
        variant="filled"
        fullWidth
        color="secondary"
        onChange={(e)=>{
          setMessage(e.target.value);
        }}
      />
      </div>
      <div className="button">
      <Button onClick={SendMessage} variant="contained" color="secondary">
         Send!
      </Button>
      </div>
      <div className="message-area">
      {messages.map((val) =>
            <div class="container">
                <p>{val}</p>
                <span class="name-left">Bob</span>
            </div>)}
      </div>
    </div>
  );
}
