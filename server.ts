import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Socket.IO Integration
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track connected players
  // id -> { name, x, y, z, rotY, room }
  const players = new Map<string, any>();

  io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // Join shared room
    socket.on('player:join', ({ name, x, y, z, rotY, room, skinColor, shirtColor, pantsColor }) => {
      socket.join(room || 'lobby');
      players.set(socket.id, { 
        id: socket.id, 
        name, 
        x, 
        y, 
        z, 
        rotY, 
        room: room || 'lobby',
        skinColor,
        shirtColor,
        pantsColor
      });

      console.log(`👋 Player ${name} joined room ${room || 'lobby'}`);

      // Notify others in room
      socket.to(room || 'lobby').emit('player:joined', {
        id: socket.id,
        name,
        x,
        y,
        z,
        rotY,
        skinColor,
        shirtColor,
        pantsColor
      });

      // Synchronize list of existing players to the joiner
      const listInRoom: any[] = [];
      players.forEach((p, pid) => {
        if (p.room === (room || 'lobby') && pid !== socket.id) {
          listInRoom.push(p);
        }
      });
      socket.emit('players:list', listInRoom);
    });

    // Sync Movement
    socket.on('player:move', (data) => {
      const p = players.get(socket.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        p.z = data.z;
        p.rotY = data.rotY;
        if (data.skinColor) p.skinColor = data.skinColor;
        if (data.shirtColor) p.shirtColor = data.shirtColor;
        if (data.pantsColor) p.pantsColor = data.pantsColor;

        // Broadcast to other players in room
        socket.to(p.room).emit('player:moved', {
          id: socket.id,
          x: data.x,
          y: data.y,
          z: data.z,
          rotY: data.rotY,
          skinColor: p.skinColor,
          shirtColor: p.shirtColor,
          pantsColor: p.pantsColor,
        });
      }
    });

    // Sync block changes
    socket.on('block:change', ({ x, y, z, blockId }) => {
      const p = players.get(socket.id);
      if (p) {
        socket.to(p.room).emit('block:changed', {
          x,
          y,
          z,
          blockId,
          sender: p.name,
        });
      }
    });

    // Chat messages
    socket.on('chat:send', (text) => {
      const p = players.get(socket.id);
      if (p) {
        io.to(p.room).emit('chat:received', {
          id: Math.random().toString(),
          sender: p.name,
          text,
        });
      }
    });

    // Voice Chat Signaling
    socket.on('voice:request_peers', () => {
      const p = players.get(socket.id);
      if (p) {
        // Return list of other peers in the room
        const peersInRoom: string[] = [];
        players.forEach((otherP, pid) => {
          if (otherP.room === p.room && pid !== socket.id) {
            peersInRoom.push(pid);
          }
        });
        socket.emit('voice:peers', peersInRoom);
      }
    });

    socket.on('voice:offer', (data) => {
      socket.to(data.to).emit('voice:offer', { from: socket.id, offer: data.offer });
    });

    socket.on('voice:answer', (data) => {
      socket.to(data.to).emit('voice:answer', { from: socket.id, answer: data.answer });
    });

    socket.on('voice:candidate', (data) => {
      socket.to(data.to).emit('voice:candidate', { from: socket.id, candidate: data.candidate });
    });

    // Latency measuring
    socket.on('latency:ping', (timestamp) => {
      socket.emit('latency:pong', timestamp);
    });

    socket.on('disconnect', () => {
      const p = players.get(socket.id);
      if (p) {
        console.log(`🔌 Player disconnected: ${p.name} (${socket.id})`);
        socket.to(p.room).emit('player:left', socket.id);
        players.delete(socket.id);
      }
    });
  });

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', playersCount: players.size });
  });

  // Dev server integrations
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dedicated voxel gaming server is live on http://localhost:${PORT}`);
  });
}

startServer();
