import React, {useState, useEffect, useContext} from 'react'
import { Button, TextField } from '@material-ui/core'
import {useHistory} from "react-router-dom"
import Axios from 'axios'
import UserContext from '../../context/UserContext'
import defaultPic from '../../img/userpic.JPG'
import { Switch } from "antd"
import moment from "moment"
import io from 'socket.io-client'

const socket = io.connect('http://localhost:5000')

export default function HomePage(){
  const history = useHistory();
  const {UserData, setUserData} = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchResult, setSearchResult] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [page, setPage] = useState("home");
  const [suggested, setSuggested] = useState([]);
  const [followers, setFollowers] = useState([])
  const [links, setLinks] = useState([])
  const [links2, setLinks2] = useState([])
  const [following, setFollowing] = useState([])
  const [formData, setFormData] = useState({
    img: ""
  });
  const [im, setImg] = useState(null);
  const [style, setStyle] = useState("ff-followbutton");
  const [text, setText] = useState("follow");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [UpdateUsername, setUpdateUsername] = useState("")
  const [UpdateEmail, setUpdateEmail] = useState("")
  const [Bio, setBio] = useState("")
  const arr = []; //Append when you want to refresh page
  const NAME_OF_UPLOAD_PRESET = "jeienwmp";
  const YOUR_CLOUDINARY_ID = "dzblv4c9h";

  var username, email, bio

  const handleFileChange = async event => {
    const [file] = event.target.files;
    if (!file) return;

    setUploadingImg(true);
    const uploadedUrl = await uploadImage(file);
    setFormData({ ...formData, img: uploadedUrl });
    setUploadingImg(false);
  };

  const handleSubmit = event => {
    event.preventDefault();
    // disable the form submit when uploading image
    if (uploadingImg) return;

    // upload `formData` to server
  };

async function uploadImage(file){
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", NAME_OF_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${YOUR_CLOUDINARY_ID}/image/upload`,
    {
      method: "POST",
      body: data
    }
  );
  const img = await res.json();
  const resp = await Axios.post("http://localhost:5000/users/upload", null, {headers:{"auth-token":  localStorage.getItem("auth-token"), "image_url":img.secure_url}})
  setImg(img.secure_url)
  return img.secure_url
}

useEffect(()=>{
  let refreshFollow=async()=>{
  try{
    let token = localStorage.getItem("auth-token"); //check if there is already a user logged in
    if(token === null){ //if not then set an auth-token variable to empty string
      localStorage.setItem("auth-token", "");
      token = "";
    }

    const tokenRes = await Axios.post("http://localhost:5000/users/tokenIsValid", null, {headers: { "auth-token": token }});
    if(tokenRes.data){
      const user = await Axios.get("http://localhost:5000/users/", {headers: {"auth-token": token}});
      try{
          setImg(getImage(user.data.displayName))
      }
      catch(err){

      }
      setmessages()
      setfollowers()
      setfollowing()
    }
  }catch(err){
  }
}
refreshFollow()
},[])

const submitEdit = async(e)  => {
  e.preventDefault()
  try{
    let token = localStorage.getItem("auth-token")
    await Axios.post("http://localhost:5000/users/edits",{displayName: UpdateUsername, email: UpdateEmail, bio: Bio} ,{headers: {"auth-token": token}});
  }
  catch{

  }
}

socket.on("refresh", async(data)=>{
    const user = UserData.user;
      setTimeout(function(){
          console.log("refresh detected")
          setmessages()
      }, 2000);
    return;
  })


//run setfollowers/setfollowing function when followers/following menu item clicked
const setfollowers = async() => {
  const f = await Axios.get("http://localhost:5000/users/followers", {headers:{"auth-token":  localStorage.getItem("auth-token")}})
  setFollowers(f.data)
}

const setmessages = async() => {
  const messages = await Axios.get("http://localhost:5000/users/getMsgs", {headers: { "auth-token": localStorage.getItem("auth-token"), "displayName": UserData.user.displayName }});
  setMessages(messages.data.messages)
}

const setfollowing = async() => {
  const arr = await Axios.get("http://localhost:5000/users/getRecommended", {headers: {"auth-token": localStorage.getItem("auth-token"), "displayName": UserData.user.displayName}});
  setSuggested(arr.data);
  const f = await Axios.get("http://localhost:5000/users/following", {headers:{"auth-token":  localStorage.getItem("auth-token")}})
  setFollowing(f.data)
}


const logout = () => {
  setUserData({
    token: undefined,
    user: undefined
  });
  localStorage.setItem("auth-token", "");
  localStorage.setItem("message", "");
  history.push("/");
};


  const SendMessage = async(e) => {
    e.preventDefault();
    try{
      if(!(message === null || message.match(/^ *$/) !== null)){
      setfollowers()
      const p = message
      const user = await Axios.post("http://localhost:5000/users/addMsg", null, {headers: { "auth-token": localStorage.getItem("auth-token"), "message": p}}); //header includes token & message
      setMessages(user.data.messages);
      }
    }
    catch(err){
    }
    setMessage("");
  }

  const findFriends = async(e) => {
    e.preventDefault();
    try{
      localStorage.setItem("searched-name", searchResult);
      const users = await Axios.get("http://localhost:5000/users/getUsers", {headers: { "auth-token": localStorage.getItem("auth-token"), "searchedname": localStorage.getItem("searched-name")}});
      const user = await Axios.get("http://localhost:5000/users/", {headers: {"auth-token": localStorage.getItem("auth-token")}});
      //users.data should return a JSON object with an array of displayNames
      const follow = await Axios.get("http://localhost:5000/users/following",{headers: { "auth-token": localStorage.getItem("auth-token")}});
      if(searchResult!=user.data.displayName && !user.data.following.includes(searchResult)){
        setSearchResults(users.data.displayNames);
      }
    }
    catch(err){}
  }

  const follow = async(val) => {
    try{
      const user = await Axios.get("http://localhost:5000/users/", {headers: {"auth-token": localStorage.getItem("auth-token")}});
      const follow = await Axios.post("http://localhost:5000/users/following",null, {headers: { "followed": val, "follower": user.data.displayName}});
      setSearchResults("")
      setfollowing()
    }
    catch(err){
            console.log("err")
    }
  }

  const unfollow = async(val) => {
    try{
      const user = await Axios.get("http://localhost:5000/users/", {headers: {"auth-token": localStorage.getItem("auth-token")}});
      const unfollow = await Axios.post("http://localhost:5000/users/unfollowing",null, {headers: { "followed": val, "follower": user.data.displayName}});
      setSearchResults("")
      setfollowing()
    }
    catch(err){}
  }

  const helper = (val) => {
    val=val.substring(0, val.lastIndexOf(" "));
    val=val.substring(0, val.lastIndexOf(" "));
    return val;
  }

  const getDate = (val) => {
    const current = moment(val.split(" ")[val.split(" ").length-1], "MMMDoYYYY").fromNow()
    var x = current.replace(/(<[^>]*>)/g,'').split(' ')
    if ( current == "an hour ago" || x[x.length-1]=="ago"&&x[x.length-2]==("hours") || x[x.length-1]=="ago"&&x[x.length-2]==("minutes") || current == "a day ago"){
      return "today"
    }
    else{
      return current
    }
  }

  const getImage = async(user) => {
    try{
    const userImage = await Axios.get("http://localhost:5000/users/getImage", {headers: {"searchedname": user}});
    setImg(userImage.data.image_url[0])
    return userImage.data.image_url[0]
    }
    catch(err){
      return undefined;
    }
  }

//image for user does exist in database then display Image
return (
  <div className="home">
      <div className="home-rest">
      <div className="home-user">
      <div>
        {
          !im ?
             (<img className="userPic" style={{margin: "-15% 0 0 11%"}} src={defaultPic}/>)
          : (
                      <figure>
                      <img
                      alt="preview"
                      src={im}
                      className="profilePic"
                      />
                      </figure>
            )
        }
      </div>
      //<div className="name">{UserData.user.displayName}</div>
      {UserData.user.bio!=" "?(
        <div className="bio">{UserData.user.bio}</div>
      ):null}
        <div className="follow">
            <div className="textStyle">Followers</div>
            <div className="follower" style={{margin: "10% 0 0 13rem"}}> <div className="followerText">{followers.length}</div> </div>
            <div className="textStyle" style={{margin: "7rem 0 0 68%"}}>Following</div>
            <div className="follower" style={{margin: "10% 0 0 21rem"}}> <div className="followerText">{following.length}</div> </div>
        </div>
        <div class="vertical-menu">
          <a href="#" onClick={()=>{setPage("home")}}>My Feed</a>
          <a href="#" onClick={()=>{setPage("followers"); }}>Followers</a>
          <a href="#" onClick={()=>{setPage("following"); }}>Following</a>
          <a href="#" onClick={()=>{setPage("Edit")}}>Edit Profile</a>
          <a href="#" onClick={logout}>Log Out</a>
        </div>
      </div>
      {page=="home" ? (
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
                  value={message}
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
                          <p>{helper(val)}</p>
                          <span class="name-left">{val.split(" ")[val.split(" ").length-2]}</span>
                          <span class="date-left">{getDate(val)}</span>
                      </div>
                )}
                </div>
              </div>) : null
        }

        {page=="followers" ? (
        <div className="home-feed">
        <div className="message-area">
        <div style={{margin: "-20% 0 0 0", height: "35%"}}>
        <span className="home-explore-text" style={{position: "relative"}}> Followers </span>
        {
          followers.map((val,index) =>
          <div id="followers-card"  style={{width: "300%", margin: "25% 0 0 -80%"}}>
          <div style={{height: "30%"}}>
          {
            !val.image ?
               (<img className="userPic" style={{margin: "-3.0% 0 0 2%", width: "9%", height: "25%", position: "absolute"}} src={defaultPic}/>)
            : (
          <img
          alt="preview"
          src={val.image}
          className="profilePic"
          style={{position: 'absolute', height: "20%", width: '3.2rem', margin: "-1.9% 0 0 3%"}}
          />
          )
        }
          </div>
          <p style={{margin: "0 0 0 28%"}}> {val.displayName} </p>
          </div>
          )
        }
        </div>
        </div>
        </div>) : null}

        {page=="following" ? (
        <div className="home-feed">
        <div className="message-area">
        <div style={{margin: "-20% 0 0 -10%", height: "30%"}}>
        <span className="home-explore-text" style={{margin: "0% 0 0 54%", position: "relative"}}> Following </span>
        <div style={{margin: "5% 0 0 60%", height: '100%', width: "70%"}}>
        {
          following.map((val,index) =>
          <div key={val} id="followers-card">
          <div style={{height: "30%"}}>
          {
            !val.image ?
               (<img className="userPic" style={{margin: "-3.0% 0 0 2%", width: "9%", height: "25%", position: "absolute"}} src={defaultPic}/>)
            : (
              <img
            alt="preview"
            src={val.image}
            className="profilePic"
            style={{position: 'absolute', height: "20%", width: '3.2rem', margin: "-1.9% 0 0 3%"}}
            />
            )
          }
          </div>
          <p> {val.displayName} </p>
          <div style={{position: "absolute", margin: "-1% 0 0 25%", height: "6.5%"}} class="ff-followbutton" ><Switch checkedChildren="unfollow" onChange={checked=>{checked?unfollow(val.displayName):unfollow(val.displayName)}} unCheckedChildren="unfollow" defaultunChecked /></div>
          </div>
          )
        }
        </div>
        </div>
        </div>
        </div>) : null}

        {page=="Edit" ? (<div style={{margin: "0 0 0 41%"}} className="home-feed">
        <div className="edit-area">Edit Profile</div>
        <div className="edit-area-text">Username</div>
        <div className="sizing3"> <TextField id="filled-search" type="search" variant="filled" color="secondary" onChange={(e)=>{setUpdateUsername(e.target.value);}}/> </div>
        <div className="edit-area-text">Email</div>
        <div className="sizing3"> <TextField id="filled-search" type="search" variant="filled" color="secondary" onChange={(e)=>{setUpdateEmail(e.target.value);}}/> </div>
        <div className="edit-area-text">Bio</div>
        <div className="sizing3"> <TextField id="filled-search" type="search" variant="filled" color="secondary" onChange={(e)=>{setBio(e.target.value);}}/> </div>
        <form onSubmit={handleSubmit}>
        <div className="edit-area-text" style={{margin: "10% 0 0 0"}}>Upload Profile Picture</div>
        <div style={{margin: "10% 0 0 5%"}}>
        <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploadingImg}
        />
        </div>
        <div style={{margin: "5% 0 0 15%"}} className="edit-profile-btn">
        </div>
        </form>
        <div className="edit-profile-btn" style={{margin: "5% 0 0 -10%"}}> <Button variant="contained" color="secondary" onClick={(e)=>{submitEdit(e);}}>
          Submit Changes
        </Button>
        </div>
        </div>) : null}

      <div className="home-explore">
        <div className="home-explore-text"> Follow Friends </div>
        <div className="sizing2"> <TextField id="filled-search" label="Search" type="search" variant="filled" color="secondary" onChange={(e)=>{setSearchResult(e.target.value);}}/> </div>
        <div className="button2">
        <Button onClick={findFriends} variant="contained" color="secondary">
           Search
        </Button>
        </div>
        {!following.includes(searchResults[0])&&searchResults[0]? (
        <div id="ff-card" style={{height: "6.5%"}}>
        <p> {searchResults} </p>
        <div class="ff-followbutton"><Switch checkedChildren="follow" onChange={checked=>{checked?follow(searchResults):follow(searchResults)}} unCheckedChildren="following" defaultChecked /></div>
       </div>
        ) : null}
       <div className="home-explore-text" style={{margin: "68% 0 0 16%"}}> Suggested Friends </div>
       <div style={{margin: "22% 0 0 0", height: "80%", width: "30%", position: "fixed"}}>
       {
          suggested?suggested.map((val, index) =>
            (
              <div key={index} id="ff-card">
                <p> {val} </p>
                <div class={style}><Switch checkedChildren="follow" onChange={checked=>{checked?follow(val):follow(val)}} unCheckedChildren="follow" defaultChecked /></div>
              </div>
            )):null
        }
      </div>
      </div>
    </div>
  </div>
  )
  /*
  <div className="name">{UserData.user.displayName}</div>
  {UserData.user.bio!=" "?(
    <div className="bio">{UserData.user.bio}</div>
  ):null}
  */
};
//{UserData.user.displayName} put for image text
