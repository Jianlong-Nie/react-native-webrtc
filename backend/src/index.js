const express = require("express");
const app = express();

const port = 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(
  server, 
  { origins: "*:*" ,
   pingTimeout:50000
});
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", (e) => console.log(e));
server.listen(port, () => console.log(`Server is running on port ${port}`));

let broadcaster;
let invitedUser;
let users = [];
let rooms = [];

io.sockets.on("connection", (socket) => {
  //console.log("连接成功");
  socket.on("broadcaster", (userid) => {
    console.log("connected："+userid);
    broadcaster = socket.id;
    const user = users.find((item)=> item.userid == userid);
    console.log('====================================');
    console.log("currentuser："+userid);
    console.log('====================================');
    if (user) {
      // console.log("error："+"The current user already exists");
      // socket.emit("userexits", "The current user already exists");
      user.userid = userid;
      user.socketId = socket.id;
    } else{
      users.push({
        userid:userid,
        socketId:socket.id
      });
    }
    console.log('====================================');
    console.log(users);
    console.log('====================================');
    //socket.emit("broadcaster");
  });
  socket.on("watcher", () => {
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("login", () => {
    socket.to(broadcaster).emit("login", socket.id);
  });
  socket.on("refuse", (userid) => {
    const user = users.find((item)=> item.userid ==userid);
    if (user) {
      socket.to(user.socketId).emit("refuse", "refuse");
    }
  });
  socket.on("disconnect", (message) => {
    console.log("disconnect"+message);
    console.log('====================================');
    console.log(users);
    console.log('====================================');
    users = users.filter((item)=>item.socketId!=socket.id);
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
  socket.on("join-room", (sender,userid, message) => {
    invitedUser = userid;
    //sender邀请人
    //userid 邀请的目标用户
    console.log("join-room");
    console.log('====================================');
    console.log(users);
    console.log('====================================');
    const user = users.find((item)=> item.userid ==userid);
    if (user) {
      console.log("user in");
      socket.to(user.socketId).emit("offer", sender, message);
     }else{
      console.log("user not in");
      socket.emit("user-not-in", sender, message);
     }
  });
  socket.on("answer", (userid, message) => {
    console.log("anwser"+userid);
    console.log('====================================');
    console.log(users);
    console.log('====================================');
    const user = users.find((item)=> item.userid ==userid);
    if (user) {
      socket.to(user.socketId).emit("answer", socket.id, message);
    }
    
  });
  socket.on("candidate", (message) => {
    console.log("candidate"+invitedUser);
    if (!invitedUser) {
      return;
    }
    const user = users.find((item)=> item.userid ==invitedUser);
    socket.to(user.socketId).emit("candidate", message);
     
    
  });
  socket.on('comment', (id, message) => {
    socket.to(id).emit("comment", socket.id, message);
  });
});
