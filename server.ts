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

  // Track state of each custom room
  // roomName -> { seed, biome, mode, difficulty, botCount, t, dayCount, keys, victory }
  const roomStates = new Map<string, any>();

  // Synchronize day-night cycle for all rooms on the server every 1 second
  setInterval(() => {
    roomStates.forEach((roomState, roomName) => {
      const prevT = roomState.t || 0.35;
      // Increment t by 0.009 (matches standard 60fps client progression rate per second)
      const nextT = (prevT + 0.009) % 1;
      
      roomState.t = nextT;

      // When day wraps around, increment survival dayCount
      if (nextT < prevT) {
        roomState.dayCount = (roomState.dayCount || 1) + 1;
        io.to(roomName).emit('room:new_day', { dayCount: roomState.dayCount });
      }

      // Broadcast exact time to ensure absolute frame alignment across clients
      io.to(roomName).emit('room:time_sync', { t: nextT });
    });
  }, 1000);

  io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // Join shared room
    socket.on('player:join', ({ name, x, y, z, rotY, room, skinColor, shirtColor, pantsColor, gameOptions }) => {
      const roomName = room || 'lobby';
      socket.join(roomName);

      // Initialize room state dynamically if this is the first joiner or host
      if (!roomStates.has(roomName)) {
        roomStates.set(roomName, {
          seed: gameOptions?.seed || 'voxelverse-2026',
          biome: gameOptions?.biome || 'plains',
          mode: gameOptions?.mode || 'treasure',
          difficulty: gameOptions?.difficulty || 'normal',
          botCount: gameOptions?.botCount || '3',
          t: 0.35,
          dayCount: 1,
          keys: gameOptions?.mode === 'treasure' ? 1 : 0,
          victory: false
        });
      }

      const rState = roomStates.get(roomName);

      players.set(socket.id, { 
        id: socket.id, 
        name, 
        x, 
        y, 
        z, 
        rotY, 
        room: roomName,
        skinColor,
        shirtColor,
        pantsColor
      });

      console.log(`👋 Player ${name} joined room ${roomName} (Seed: ${rState.seed}, Biome: ${rState.biome})`);

      // Notify others in room
      socket.to(roomName).emit('player:joined', {
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
        if (p.room === roomName && pid !== socket.id) {
          listInRoom.push(p);
        }
      });
      socket.emit('players:list', listInRoom);

      // Synchronize existing room parameters (time, keys, victory) to joiner on join
      socket.emit('room:initial_sync', {
        keys: rState.keys,
        t: rState.t,
        dayCount: rState.dayCount,
        victory: rState.victory
      });
    });

    // Sync Key Additions
    socket.on('room:add_key', ({ name }) => {
      const p = players.get(socket.id);
      if (p) {
        const rState = roomStates.get(p.room);
        if (rState) {
          rState.keys = (rState.keys || 0) + 1;
          io.to(p.room).emit('room:keys_sync', {
            keysCollected: rState.keys,
            collector: name || p.name
          });
        }
      }
    });

    // Sync Key Deductions
    socket.on('room:deduct_key', ({ name }) => {
      const p = players.get(socket.id);
      if (p) {
        const rState = roomStates.get(p.room);
        if (rState) {
          rState.keys = Math.max(0, (rState.keys || 0) - 1);
          io.to(p.room).emit('room:keys_sync', {
            keysCollected: rState.keys,
            opener: name || p.name
          });
        }
      }
    });

    // Sync Victory (Treasure / Quest Opened)
    socket.on('room:victory', ({ name }) => {
      const p = players.get(socket.id);
      if (p) {
        const rState = roomStates.get(p.room);
        if (rState) {
          rState.victory = true;
          rState.keys = 0;
          io.to(p.room).emit('room:victory_sync', {
            opener: name || p.name,
            keysCollected: 0
          });
        }
      }
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
        const roomName = p.room;
        players.delete(socket.id);

        // Delete empty custom rooms to free memory
        if (roomName !== 'lobby') {
          let hasRemainingPlayers = false;
          players.forEach((playerObj) => {
            if (playerObj.room === roomName) {
              hasRemainingPlayers = true;
            }
          });
          if (!hasRemainingPlayers) {
            console.log(`🧹 Room ${roomName} is empty. Removing from roomStates.`);
            roomStates.delete(roomName);
          }
        }
      }
    });
  });

  // API to fetch existing room configs for joiners to synchronize with the hosts
  app.get('/api/room-config', (req, res) => {
    const rName = String(req.query.room || '').trim();
    if (!rName) {
      return res.status(400).json({ error: 'Missing room custom query parameter' });
    }
    const state = roomStates.get(rName);
    if (state) {
      return res.json({
        exists: true,
        config: {
          seed: state.seed,
          biome: state.biome,
          mode: state.mode,
          difficulty: state.difficulty,
          botCount: state.botCount,
          t: state.t,
          dayCount: state.dayCount,
          keys: state.keys,
          victory: state.victory
        }
      });
    } else {
      return res.json({ exists: false });
    }
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
