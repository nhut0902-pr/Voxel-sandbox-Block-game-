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
      try {
        const { from, offer } = data;
        const pc = this.getOrCreateConnection(from);
        
        // Handle potential glare by rolling back if necessary, 
        // though standard is polite peer. For simplicity, just try/catch.
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit('voice:answer', { to: from, answer });
      } catch (err) {
        console.warn('voice:offer error', err);
      }
    });

    this.socket.on('voice:answer', async (data: any) => {
      try {
        const { from, answer } = data;
        const pc = this.connections.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.warn('voice:answer error', err);
      }
    });

    this.socket.on('voice:candidate', async (data: any) => {
      try {
        const { from, candidate } = data;
        const pc = this.connections.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn('voice:candidate error', err);
      }
    });

    this.socket.on('player:leave', (data: any) => {
      const id = data.id || data.playerId;
      this.closeConnection(id);
    });

    this.socket.on('voice:peers', (peers: string[]) => {
      peers.forEach(peerId => {
        if (peerId !== this.socket.id) {
          // Creating the connection will trigger onnegotiationneeded if we have a local stream
          // which will automatically create and send the offer. If we don't have a local stream,
          // we can just wait for the offer.
          this.getOrCreateConnection(peerId);
        }
      });
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
      
      // Unmute all remote audios since we joined
      this.audioElements.forEach(audio => {
        audio.muted = false;
        audio.play().catch(e => console.warn('Audio play prevented:', e));
      });

      // Add stream tracks to any existing PC connections we might already have
      if (this.localStream) {
        this.connections.forEach(pc => {
          this.localStream!.getTracks().forEach(track => {
            const senders = pc.getSenders();
            if (!senders.find(s => s.track === track)) {
              pc.addTrack(track, this.localStream!);
            }
          });
        });
      }

      // We broadcast to existing players that we want to initiate a voice call!
      if (this.socket) {
        this.socket.emit('voice:request_peers');
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

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed' || pc.iceConnectionState === 'disconnected') {
        this.closeConnection(peerId);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit('voice:offer', { to: peerId, offer });
      } catch(err) {
        console.error('Error during negotiation:', err);
      }
    };

    pc.ontrack = (event) => {
      // Create audio element for the remote stream
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.muted = !this.isActive; // Mute if user hasn't joined voice
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
