const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export class VoiceChat {
  constructor(game) {
    this.game = game;
    this.peers = new Map();
    this.audios = new Map();
    this.localStream = null;
    this.isMuted = false;
    this.isEnabled = false;
  }

  async start() {
    if (this.isEnabled) return true;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      this.isEnabled = true;
      this.game.net.send({ t: 'voice:ready' });
      return true;
    } catch (e) {
      console.warn('Mikrofon nicht verfügbar:', e);
      return false;
    }
  }

  stop() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    for (const pc of this.peers.values()) pc.close();
    this.peers.clear();
    for (const a of this.audios.values()) { a.srcObject = null; a.remove(); }
    this.audios.clear();
    this.game.net.send({ t: 'voice:leave' });
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => { t.enabled = !muted; });
    }
  }

  onMessage(m) {
    if (!this.isEnabled) return;
    switch (m.t) {
      case 'voice:user': this.connectTo(m.id); break;
      case 'voice:offer': this.handleOffer(m.id, m.sdp); break;
      case 'voice:answer': this.handleAnswer(m.id, m.sdp); break;
      case 'voice:ice': this.handleICE(m.id, m.candidate); break;
      case 'voice:leave': this.removePeer(m.id); break;
    }
  }

  async connectTo(peerId) {
    if (this.peers.has(peerId)) return;
    const pc = this.createPC(peerId);
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) pc.addTrack(track, this.localStream);
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.game.net.send({ t: 'voice:offer', targetId: peerId, sdp: offer.sdp });
  }

  async handleOffer(peerId, sdp) {
    let pc = this.peers.get(peerId);
    if (!pc) pc = this.createPC(peerId);
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        if (!pc.getSenders().some(s => s.track === track)) pc.addTrack(track, this.localStream);
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.game.net.send({ t: 'voice:answer', targetId: peerId, sdp: answer.sdp });
  }

  async handleAnswer(peerId, sdp) {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
  }

  async handleICE(peerId, candidate) {
    const pc = this.peers.get(peerId);
    if (!pc || !candidate) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  createPC(peerId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(peerId, pc);

    pc.onicecandidate = e => {
      if (e.candidate) {
        this.game.net.send({ t: 'voice:ice', targetId: peerId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = e => {
      let audio = this.audios.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audios.set(peerId, audio);
      }
      audio.srcObject = e.streams[0] || new MediaStream([e.track]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    return pc;
  }

  removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) { pc.close(); this.peers.delete(peerId); }
    const a = this.audios.get(peerId);
    if (a) { a.srcObject = null; a.remove(); this.audios.delete(peerId); }
  }
}
