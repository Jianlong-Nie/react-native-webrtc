const express = require('express');
const app = express();

const port = 4000;

const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server, { origins: '*:*', pingTimeout: 50000 });
app.use(express.static(__dirname + '/public'));

io.sockets.on('error', (e) => console.log(e));
server.listen(port, () => console.log(`Server is running on port ${port}`));

let broadcaster;
let invitedUser;
let users = [];
// let rooms = [{roomId:myroom,friends:[]}];
const rooms = {};

function socketIdsInRoom(roomID) {
  let socketIds = io.sockets.adapter.rooms.get(roomID);
  console.log('====================================');
  console.log(socketIds);
  console.log('====================================');
  if (socketIds) {
    // let collection = [];
    // for (let key in socketIds) {
    //   collection.push(key);
    // }
    return Array.from(socketIds);
  } else {
    return [];
  }
}

io.sockets.on('connection', (socket) => {
  console.log('====================================');
  console.log('连接成功：' + socket.id);
  console.log('====================================');
  socket.on('join', (roomID, callback) => {
    console.log('join', roomID);
    let socketIds = socketIdsInRoom(roomID);
    console.log(socketIds);
    callback(socketIds);
    socket.join(roomID);
    socket.room = roomID;
  });
  socket.on('exchange', (data) => {
    console.log('exchange', data.to);
    console.log('====================================');
    console.log(io.sockets.sockets.get(data.to));
    console.log('====================================');
    data.from = socket.id;
    let to = io.sockets.sockets.get(data.to);
    console.log('====================================');
    //console.log(to);
    console.log('====================================');
    to.emit('exchange', data);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');

    if (socket.room) {
      let room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);

      console.log('leave');
    }
  });
});
