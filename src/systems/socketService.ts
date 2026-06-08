import { io, Socket } from 'socket.io-client';

export class SocketService {
  private static instance: SocketService | null = null;
  public socket: Socket | null = null;
  private listeners: { event: string; callback: (data: any) => void }[] = [];

  public static getInstance(): SocketService {
    if (!this.instance) {
      this.instance = new SocketService();
    }
    return this.instance;
  }

  public connect(
    playerName: string, 
    x: number, 
    y: number, 
    z: number, 
    rotY: number, 
    room: string,
    skinColor?: string,
    shirtColor?: string,
    pantsColor?: string,
    gameOptions?: any
  ): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to window origin (port 3000 proxy ingress handles WebSocket upgrades natively)
    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to multiplayer lobby:', this.socket?.id);
      
      // Join room
      this.socket?.emit('player:join', {
        name: playerName,
        x,
        y,
        z,
        rotY,
        room: room || 'lobby',
        skinColor,
        shirtColor,
        pantsColor,
        gameOptions
      });
    });

    // Replay listeners if already registered
    for (const listener of this.listeners) {
      this.socket.on(listener.event, listener.callback);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    this.listeners.push({ event, callback });
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = SocketService.getInstance();
