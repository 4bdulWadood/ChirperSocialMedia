import React, {useState, useEffect} from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Login from "./components/pages/Login";
import Home from './components/pages/HomePage';
import UserContext from './context/UserContext';

//import Home from "./components/pages/Home";
import Axios from 'axios';
import "./style.css";

export default function App(){
  const [UserData, setUserData] = useState({
    token: undefined,
    user: undefined,
    image_url: undefined
  });

  useEffect(
    ()=>{
      const checkLoggedIn = async() => {
        let token = localStorage.getItem("auth-token");
        if(token===null){
          localStorage.setItem("auth-token", "");
          token = "";
        }
        const tokenRes = await Axios.post("http://localhost:5000/users/tokenIsValid", null, {headers: {"x-auth-token": token}}); //Checks to see if a user with token exists
        if(tokenRes.data){
          const user = await Axios.get("http://localhost:5000/users/", {headers: {"x-auth-token": token}});
          setUserData({
            token,
            user: user.data
          });
        }

      }
      checkLoggedIn();
    },[]
  );

  return (
    <BrowserRouter>
    <UserContext.Provider value={{UserData, setUserData}}>
      <Switch>
        <div>
        <Route exact path="/" component={Login}/>
        <Route exact path="/home" component={Home}/>
        </div>
      </Switch>
    </UserContext.Provider>
    </BrowserRouter>
  )
};
