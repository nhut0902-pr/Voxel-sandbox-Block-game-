export class VoiceChatManager {
  private socket: any;
  private localStream: MediaStream | null = null;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  public onStateChange: (active: boolean) => void = () => {};
  public isActive = false;

  constructor() {}

  public setSocket(socket: any) {
    this.socket = socket;
    if (!this.socket) return;
    
    this.socket.on('voice:offer', async (data: any) => {
      const { from, offer } = data;
      const pc = this.getOrCreateConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket.emit('voice:answer', { to: from, answer });
    });

    this.socket.on('voice:answer', async (data: any) => {
      const { from, answer } = data;
      const pc = this.connections.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    this.socket.on('voice:candidate', async (data: any) => {
      const { from, candidate } = data;
      const pc = this.connections.get(from);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    this.socket.on('player:leave', (data: any) => {
      const id = data.id || data.playerId;
      this.closeConnection(id);
    });
  }

  public async toggleVoice(roomId: string): Promise<boolean> {
    if (this.isActive) {
      this.stop();
      return false;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.isActive = true;
      this.onStateChange(true);
      
      // We broadcast to existing players that we want to initiate a voice call!
      if (this.socket) {
        this.socket.emit('voice:request_peers');
        
        // Listen to response back for peer IDs to connect to
        this.socket.on('voice:peers', (peers: string[]) => {
          peers.forEach(peerId => {
            if (peerId !== this.socket.id) {
              const pc = this.getOrCreateConnection(peerId);
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                this.socket.emit('voice:offer', { to: peerId, offer });
              });
            }
          });
        });
      }
      return true;
    } catch (err) {
      console.error('Microphone API error:', err);
      throw err;
    }
  }

  private getOrCreateConnection(peerId: string): RTCPeerConnection {
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.connections.set(peerId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('voice:candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      // Create audio element for the remote stream
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        this.audioElements.set(peerId, audio);
        document.body.appendChild(audio);
      }
      audio.srcObject = event.streams[0];
    };

    return pc;
  }

  private closeConnection(peerId: string) {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      this.audioElements.delete(peerId);
    }
  }

  public stop() {
    this.isActive = false;
    this.onStateChange(false);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    
    const peers = Array.from(this.connections.keys());
    peers.forEach(p => this.closeConnection(p));
  }
}

export const voiceManager = new VoiceChatManager();
