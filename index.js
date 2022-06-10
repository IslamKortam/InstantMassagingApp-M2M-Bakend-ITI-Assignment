const { selfURL } = require('./helpers/globalVariablesAndFuntions');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


const onlineUsers = [];


const msgs = [];

const getChatHeaders = (clientId) => {
    const chatHeaders = onlineUsers.map(userId => ({id: userId, user: {id: userId, photoURL: ''}, notSeenMsgs: 0}))
    return chatHeaders;
}






io.on('connection', (socket) => {
  console.log('a user connected with id:', socket.id);

  const id = socket.id;

  io.to(socket.id).emit('clientData', {id: socket.id})
  //Send the array of the online users to the user
  io.to(socket.id).emit('chatHeaders', getChatHeaders(socket.id));

  //Send a notification to all users notfying the status of this user
  socket.broadcast.emit('userStatusChange', {userId: socket.id, status: 'ONLINE'});

  onlineUsers.push(socket.id);
  
  socket.on('sendMsg', (msg) => {
      msg.senderId = socket.id;
      msg.date = Date.now();
      msg.isViewed = false;
      msg.isReceived = false;

      msgs.push(msg);
      
      console.log(msg);
      const {receiverId} = msg;
      if(!onlineUsers.includes(receiverId)){
          //User is offline, early return
          return;
      }
      io.to(receiverId).emit('receiveMsg', msg);
  });

  socket.on('getChat', (peerId) => {
      const chatMsgs = msgs.filter(msg => ((msg.senderId === socket.id) && (msg.receiverId === peerId)) 
                                            || ((msg.senderId === peerId) && (msg.receiverId === socket.id)) );
      io.to(socket.id).emit('chat', {chatMsgs, peerId});
  });
  
  socket.on('opendChat', (chatID) => {
      msgs.forEach((msg) => {
          if(msg.senderId === chatID && msg.receiverId === socket.id){
              msg.isViewed = true;
          }
      });
      io.to(chatID).emit('peerOpendChat', socket.id);
  })



  socket.on('disconnect', () => {
      console.log('a user disconnected');
      const userIndex = onlineUsers.indexOf(socket.id);
      if(userIndex === -1){
          return;
      }
      onlineUsers.splice(userIndex, 1);
      socket.broadcast.emit('userStatusChange', {userId: socket.id, status: 'OFFLINE'});
  });

  console.log(onlineUsers);
});

server.listen(selfURL.port, () => {
  console.log(`Listening on ${selfURL.port}, SelfURL: ${selfURL.fullURL}`);
});