const { createServer } = require("http");
const { Server } = require("socket.io");
const {producedBlocks} = require('./src/chain');
const {INTERVAL} = require('./config');
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let producedBlocksCache = {};

init();
async function init () {
  producedBlocksCache = await producedBlocks();
  loopRefreshProducedBlocks();

  io.on("connection", (socket) => {
    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { /* … */ });

    socket.emit("produced_blocks", producedBlocksCache);
    const loop = function () {
      setTimeout(async () => {
        try {
          producedBlocksCache = await producedBlocks();
          socket.emit("produced_blocks", producedBlocksCache);
        } catch(error) {
          console.log('loop error', error);
        }
        loop();
      }, INTERVAL);
    }
    loop();
  });
  httpServer.listen(3710);
}

const loopRefreshProducedBlocks = function () {
  setTimeout(async () => {
    producedBlocksCache = await producedBlocks();
  }, INTERVAL);
}
