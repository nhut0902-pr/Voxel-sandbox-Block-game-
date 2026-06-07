export class VoiceChatManager {
  private socket: any;
  private localStream: MediaStream | null = null;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private analysers: Map<string, AnalyserNode> = new Map();
  private mediaStreams: Map<string, MediaStreamAudioSourceNode> = new Map();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  public onStateChange: (active: boolean) => void = () => {};
  public onSpeakingChange: (speakers: string[]) => void = () => {};
  public isActive = false;

  private makingOffer: Map<string, boolean> = new Map();
  private candidateQueue: Map<string, RTCIceCandidateInit[]> = new Map();

  constructor() {}

  public setSocket(socket: any) {
    this.socket = socket;
    if (!this.socket) return;
    
    this.socket.on('voice:offer', async (data: any) => {
      try {
        const { from, offer } = data;
        const pc = this.getOrCreateConnection(from);
        
        const polite = this.socket.id > from;
        const offerCollision = this.makingOffer.get(from) || pc.signalingState !== 'stable';
        
        if (!polite && offerCollision) {
          return; // Ignore offer
        }
        
        // If polite and collision, we might need to rollback local offer, but setRemoteDescription does that implicitly if polite in modern WebRTC.
        await Promise.all([
          pc.setRemoteDescription(new RTCSessionDescription(offer))
        ]);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit('voice:answer', { to: from, answer });
        
        // Process queued ice candidates
        const queue = this.candidateQueue.get(from);
        if (queue) {
          for (const c of queue) await pc.addIceCandidate(new RTCIceCandidate(c));
          this.candidateQueue.delete(from);
        }
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
          
          // Process queued ice candidates
          const queue = this.candidateQueue.get(from);
          if (queue) {
            for (const c of queue) await pc.addIceCandidate(new RTCIceCandidate(c));
            this.candidateQueue.delete(from);
          }
        }
      } catch (err) {
        console.warn('voice:answer error', err);
      }
    });

    this.socket.on('voice:candidate', async (data: any) => {
      try {
        const { from, candidate } = data;
        const pc = this.connections.get(from);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          const queue = this.candidateQueue.get(from) || [];
          queue.push(candidate);
          this.candidateQueue.set(from, queue);
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
      
      this.initAudioContext();
      // Setup local mic analysis
      if (this.audioContext && this.localStream) {
        const source = this.audioContext.createMediaStreamSource(this.localStream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        this.mediaStreams.set('local', source);
        this.analysers.set('local', analyser);
      }
      
      if (!this.pollingInterval) {
        this.pollingInterval = setInterval(() => this.pollSpeaking(), 100);
      }

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

  private initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private pollSpeaking() {
    const speakers: string[] = [];
    const dbThreshold = 10; // Simple arbitrary threshold on byte frequency

    this.analysers.forEach((analyser, peerId) => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      if (avg > dbThreshold) {
        speakers.push(peerId);
      }
    });

    this.onSpeakingChange(speakers);
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
      console.log(`[Voice] ICE Connection State: ${pc.iceConnectionState} for ${peerId}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed' || pc.iceConnectionState === 'disconnected') {
        this.closeConnection(peerId);
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`[Voice] PC Connection State: ${pc.connectionState} for ${peerId}`);
    };

    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer.set(peerId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit('voice:offer', { to: peerId, offer });
      } catch(err) {
        console.error('Error during negotiation:', err);
      } finally {
        this.makingOffer.set(peerId, false);
      }
    };

    pc.ontrack = (event) => {
      // Create audio element for the remote stream
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.playsInline = true;
        audio.muted = false; // Always unmute since we only connect when active
        this.audioElements.set(peerId, audio);
        document.body.appendChild(audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(e => console.warn('Audio play error:', e));
      
      this.initAudioContext();
      if (this.audioContext && !this.analysers.has(peerId)) {
        const source = this.audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        this.mediaStreams.set(peerId, source);
        this.analysers.set(peerId, analyser);
      }
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
    const stream = this.mediaStreams.get(peerId);
    if (stream) {
      stream.disconnect();
      this.mediaStreams.delete(peerId);
    }
    this.analysers.delete(peerId);
  }

  public stop() {
    this.isActive = false;
    this.onStateChange(false);
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.onSpeakingChange([]);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    
    const stream = this.mediaStreams.get('local');
    if (stream) {
      stream.disconnect();
      this.mediaStreams.delete('local');
    }
    this.analysers.delete('local');
    
    const peers = Array.from(this.connections.keys());
    peers.forEach(p => this.closeConnection(p));
  }
}

export const voiceManager = new VoiceChatManager();
