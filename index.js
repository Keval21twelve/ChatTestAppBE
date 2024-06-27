const express = require("express");
const cors = require("cors");
const Server = require("socket.io").Server;
const { v4: uuid } = require("uuid");

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());

app.get("/", function (_, res) {
  res.send("Server is running on port " + PORT);
});

const server = app.listen(PORT, function () {
  console.log("The server is listening on port " + PORT);
});

const ACTIONS = {
  LOGIN_USER: "login",
  SEND_MESSAGE: "sendMessage",
  ONLINE_USERS: "onlineUsers",
  RECEIVE_MESSAGE: "reciveMessage",
};

const io = new Server(server, { cors: "*" });
const socketChannel = "common-chat-channel";

let users = [];
let messages = [];

io.on("connection", (socket) => {
  function sendAllMessages() {
    io.emit(socketChannel, {
      type: ACTIONS.RECEIVE_MESSAGE,
      payload: messages,
    });
  }

  function sendOnlineUsers() {
    io.emit(socketChannel, {
      type: ACTIONS.ONLINE_USERS,
      payload: users,
    });
  }

  sendOnlineUsers();

  socket.on(socketChannel, (data) => {
    const { type, payload } = data || {};

    switch (type) {
      case ACTIONS.LOGIN_USER:
        users.push(payload);
        sendOnlineUsers();
        sendAllMessages();
        break;

      case ACTIONS.SEND_MESSAGE:
        messages.push({
          ...payload,
          id: uuid(),
          timeStamp: new Date().toISOString(),
        });
        sendAllMessages();
        break;
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((item) => item.id != socket.id);
    sendOnlineUsers();
  });
});

module.exports = app;
