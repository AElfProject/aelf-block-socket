const { createServer } = require("http");
const { Server } = require("socket.io");
const {INTERVAL} = require('./config');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on('event', data => { /* … */ });
  socket.on('disconnect', () => { /* … */ });

  const loop = function () {
    setTimeout(() => {
      socket.emit("hello", `world${new Date().getTime()}`);
      loop();
    }, INTERVAL);
  }
  loop();
});
httpServer.listen(3710);
