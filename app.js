const { createServer } = require("http");
const {producedBlocks} = require('./src/chain');
const {INTERVAL} = require('./config');
const httpServer = createServer();
const io = require("socket.io")(httpServer, {
  path: '/new-socket'
});

let producedBlocksCache = {};

init();
async function init () {
  try {
    producedBlocksCache = await producedBlocks();
  } catch(error) {
    console.log('producedBlocksCache first update error', error);
  }

  io.on("connection", (socket) => {
    // socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => {
      console.log('user disconnect', socket.id);
      socket.conn.close();
    });
    socket.emit('produced_blocks', producedBlocksCache);
    console.log('user connect', socket.id, io.engine.clientsCount);
    socket.on('error', () => {
      socket.disconnect(true);
    });
  });

  const loop = function () {
    setTimeout(async () => {
      try {
        producedBlocksCache = await producedBlocks();
        io.emit("produced_blocks", producedBlocksCache);
      } catch(error) {
        console.log('loop error', error);
      }
      loop();
    }, INTERVAL);
  }
  loop();

  httpServer.listen(3710);
}

const loopRefreshProducedBlocks = function () {
  setTimeout(async () => {
    producedBlocksCache = await producedBlocks();
  }, INTERVAL);
}
