const express = require('express');
const app = express();

const port = 4000;

const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server, { origins: '*:*', pingTimeout: 50000 });
app.use(express.static(__dirname + '/public'));

io.sockets.on('error', (e) => console.log(e));
server.listen(port, () => console.log(`Server is running on port ${port}`));

var roomList = {};
/*
roomId {
    name:
    image: null
    particular: []
    token:
}
 */
var templateList = {};

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
/**
 {
     id:
     name:
     token: to detect owner
 }
 * @param room
 * @param error
 */
function createNewRoom(room, error) {
  if (roomList.hasOwnProperty(room.id)) {
    if (error) error('Room already used.');
  } else {
    roomList[room.id] = {
      name: room.name,
      image: room.image,
      token: room.token,
      participant: [],
    };

    console.log('New room: ', room);
    io.emit('newroom-client', room);
  }
}
/*************************************************
 * Find participant by socket id. Return index of array if input has roomId and resIndex = true
 */
function findParticipant(socketId) {
  for (let roomId in roomList) {
    for (let i = 0; i < roomList[roomId].participant.length; i++) {
      if (roomList[roomId].participant[i].socketId == socketId) {
        console.log(
          'roomList[roomId].participant[i]: ',
          roomList[roomId].participant[i]
        );
        return roomList[roomId].participant[i];
      }
    }
  }
  return null;
}
io.sockets.on('connection', (socket) => {
  console.log('====================================');
  console.log('连接成功：' + socket.id);
  console.log('====================================');
  socket.emit('c-success');
  socket.on('join', (joinData, callback) => {
    let roomId = joinData.roomID;
    let displayName = joinData.displayName;
    socket.join(roomId);
    socket.room = roomId;
    console.log('joinData: ', joinData);

    createNewRoom({
      id: roomId,
      name: displayName,
      image: null,
      token: socket.id,
    });
    roomList[roomId].participant.push({
      socketId: socket.id,
      displayName: displayName,
    });
    let socketIds = socketIdsInRoom(roomId);
    let friends = socketIds
      .map((socketId) => {
        let room = findParticipant(socketId);
        return {
          socketId: socketId,
          displayName: room === null ? null : room.displayName,
        };
      })
      .filter((friend) => friend.socketId != socket.id);
    callback(friends);
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
  socket.on('count-server', function (roomId, callback) {
    var socketIds = socketIdsInRoom(roomId);
    callback(socketIds.length);
  });
  socket.on('leave', function () {
    for (let roomId in roomList) {
      for (let i = 0; i < roomList[roomId].participant.length; i++) {
        if (roomList[roomId].participant[i].socketId == socket.id) {
          io.emit('leave-client', roomList[roomId].participant[i]);
          roomList[roomId].participant.splice(i, 1);
          break;
        }
      }
      setTimeout(function () {
        if (
          roomList.hasOwnProperty(roomId) &&
          roomList[roomId].participant.length === 0
        ) {
          io.emit('leaveall-client', roomId);
          delete roomList[roomId];
        }
      }, 3000);
    }
    if (socket.room) {
      socket.leave(socket.room);
    }
  });
  socket.on('list-server', function (data, callback) {
    callback(roomList);
  });

  socket.on('newroom-server', function (room, error) {
    createNewRoom(room, error);
  });
  socket.on('disconnect', function () {
    console.log('Disconnect');

    for (let roomId in roomList) {
      for (let i = 0; i < roomList[roomId].participant.length; i++) {
        if (roomList[roomId].participant[i].socketId == socket.id) {
          io.emit('leave-client', roomList[roomId].participant[i]);
          roomList[roomId].participant.splice(i, 1);
          break;
        }
      }
      setTimeout(function () {
        if (
          roomList.hasOwnProperty(roomId) &&
          roomList[roomId].participant.length === 0
        ) {
          io.emit('leaveall-client', roomId);
          delete roomList[roomId];
        }
      }, 3000);
    }
    if (socket.room) {
      socket.leave(socket.room);
    }
  });
});
