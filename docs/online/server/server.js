import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ⚡ wichtig: Pfad ein Level höher -> ../client
app.use(express.static(path.join(__dirname, "../client")));

// optional: SPA-Fallback (z. B. für React Router oder Vue Router)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",          // ✅ allow all origins
    methods: ["GET", "POST"]
  }
});


let queueArray = [];

io.on("connection", (socket) => {
    console.log(`socket: ${socket.id} conntected to the server`)

    socket.on("join-queue", (ack) => {
      queueArray.push(socket)
      if(queueArray.length===1){
        return ack({ok: true, message: `you joined the queue successfully. Please wait for an opponent...`})
        
      }
      if(queueArray.length>=2){
        let queueRoom = Math.random().toString(36).slice(2, 10);
        let p1 = queueArray.shift();
        let p2 = queueArray.shift();
        p1.join(queueRoom);
        p2.join(queueRoom);
  
        io.to(queueRoom).emit("queue-success", queueRoom);

      }

    })



    socket.on("join-room", (room, ack) => {
    const size = io.of("/").adapter.rooms.get(room)?.size || 0;

    if (size === 0) {
      socket.join(room);
      //The ack callback (ack) is how the server replies to a specific emit.
      return ack({ ok: true, message: `you joined the empty room: ${room}, wait for user to join` });
    }

    if (size === 1) {
      socket.join(room);

      //io.to(room).emit(...) → sends to all sockets in that room (everyone).
      //socket.to(room).emit(...) → sends to everyone in the room except the current
      io.to(room).emit("ready-to-start");
      return ack({ ok: true, message: `you joined the room: ${room}, this room is now full` });
    }

    // size >= 2
    return ack({ ok: false, message: `The room ${room} is already full, please join another room.` });
  });

  socket.on("send-data", (room, cellId) => {
    //go to all the rooms except to the sender!
    socket.broadcast.to(room).emit("receive-data", cellId);

  })

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.to(room).emit("leave");
    }

    // if a waiting player disconnects, remove them from the queue
    const idx = queueArray.indexOf(socket);
    if (idx !== -1) queueArray.splice(idx, 1);
  });


});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
