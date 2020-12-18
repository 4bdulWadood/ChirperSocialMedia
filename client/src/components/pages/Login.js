import React, {useState, useEffect, useContext} from 'react';
import birds from '../../img/birds.png';
import bird from '../../img/bird.jpg';
import "flatpickr/dist/themes/material_green.css";
import Flatpickr from "react-flatpickr";
import { Button, TextField } from '@material-ui/core';
import Popup from "reactjs-popup";
import Axios from "axios";
import UserContext from '../../context/UserContext';
import { useHistory } from "react-router-dom";
import Home from './Home';


export default function Login(){
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [Pass2, setPass2] = useState();
  const [userName, setUserName] = useState();
  const [date, setDate] = useState("");

  const [emaillogin, setEmaillogin] = useState("MichaelDemo@gmail.com");
  const [passwordlogin, setPasswordlogin] = useState("password");

  const { UserData, setUserData } = useContext(UserContext);

  const history = useHistory();

  const submitLogin = async(e) => { //using await to access mongoDB hence async
    e.preventDefault();
    try{
        const loginUser = {email: emaillogin, password: passwordlogin};
        const loginRes = await Axios.post("http://localhost:5000/users/login", loginUser);

        setUserData({ //user data contains email, password, userName, bday
            token: loginRes.data.token,
            user: loginRes.data.user
        });

        localStorage.setItem("auth-token", loginRes.data.token);

        history.push("/home"); //set page to home after loggin in
    }
    catch(err){
      console.log(err);
    }
  }

  const submitRegister = async(e) => {
    e.preventDefault(); //Don't reload
    try{
      const newUser = {
        email, password, passwordCheck:Pass2, displayName: userName, bday: date
      }
      await Axios.post("http://localhost:5000/users/register", newUser);
      const loginRes = await Axios.post("http://localhost:5000/users/login", {
        email,
        password
      });
      setUserData({
        token: loginRes.data.token,
        user: loginRes.data.user
      });
      localStorage.setItem("auth-token", loginRes.data.token);
      history.push("/home"); //set page to home after loggin in
    }
    catch(err){
        console.log(err);
    }
  }

  return (
    <div className = "login-parent">
      <div className = "login-left-bg">
      <div className = "login-left">
      <img className="login-left-birds" src={birds}/>
      <div className="login-left-text">
      Stay in touch.
      </div>
      </div>
      </div>
      <div class = "login-right">
      <div class="login-right-1">
      <img className="login-right-bird" src={bird}/>

      <Popup
        trigger={<Button variant="contained" color="secondary">
              Get Started!
              </Button>}
        modal
        closeOnDocumentClick
      >
      <div className="popup">
        <span className="popup-text">Create an account</span>
        <TextField
          id="filled-secondary"
          label="Username"
          variant="filled"
          color="secondary"
          onChange={(e)=>{
            setUserName(e.target.value);
          }}
        />

        <TextField
          id="filled-secondary"
          label="Password"
          variant="filled"
          color="secondary"
          type="password"

          onChange={(e)=>{
            setPassword(e.target.value);
          }}
        />
        <TextField
          id="filled-secondary"
          label="Confirm Password"
          variant="filled"
          color="secondary"
          type="password"
          onChange={(e)=>{
            setPass2(e.target.value);
          }}
        />
        <TextField
          id="filled-secondary"
          label="Email"
          variant="filled"
          color="secondary"
          onChange={(e)=>{
            setEmail(e.target.value);
          }}
        />
        <span className="popup-text2">Date of birth</span>
        <Flatpickr
          value={date}
          onChange={date => {
            setDate(date.toString())
          }}
          />
        <Button onClick={submitRegister} variant="contained" color="secondary">
          Done!
        </Button>
      </div>
      </Popup>

      </div>
      <div className="login-right-2">
        <TextField
          id="filled-secondary"
          label="Email"
          variant="filled"
          color="secondary"
          value={emaillogin}
          onChange={(e)=>{
            setEmaillogin(e.target.value);
          }}
        />
        <TextField
          id="filled-secondary"
          label="Password"
          variant="filled"
          color="secondary"
          type="password"
          value={passwordlogin}
          onChange={(e)=>{
            setPasswordlogin(e.target.value);
          }}
        />
        <Button onClick={submitLogin} variant="contained" color="secondary">
          Log In
        </Button>
      </div>
      </div>
    </div>
  );
};
