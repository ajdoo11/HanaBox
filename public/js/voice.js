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
    // iPad/Safari spielt Ton manchmal erst nach einem Antippen ab: bei jeder Berührung nochmal versuchen
    this.unlock = () => { for (const a of this.audios.values()) if (a.paused) a.play().catch(() => {}); };
    addEventListener('pointerdown', this.unlock, true);
  }

  // 'mic' = man wird gehört, 'muted' = Mikro stumm, 'listen' = nur zuhören (Mikrofon nicht erlaubt), 'off'
  get status() {
    if (!this.isEnabled) return 'off';
    if (!this.localStream) return 'listen';
    return this.isMuted ? 'muted' : 'mic';
  }

  connectedCount() {
    return [...this.peers.values()].filter(pc => pc.connectionState === 'connected').length;
  }

  // Mikrofon nachträglich erlauben: neu starten, damit alle Verbindungen das Mikrofon bekommen
  async retryMic() {
    this.stop();
    return this.start();
  }

  // Startet den Sprachchat. Ohne Mikrofon (verweigert/fehlt) hört man die anderen trotzdem.
  async start() {
    if (this.isEnabled) return true;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
    } catch (e) {
      console.warn('Mikrofon nicht verfügbar, nur zuhören:', e);
      this.localStream = null;
    }
    if (!this.game.net) return false;
    this.isEnabled = true;
    this.game.net.send({ t: 'voice:ready' });
    return !!this.localStream;
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
    } else pc.addTransceiver('audio', { direction: 'recvonly' });
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
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.playsInline = true;
        audio.setAttribute('playsinline', '');
        document.body.append(audio);
        this.audios.set(peerId, audio);
      }
      audio.srcObject = e.streams[0] || new MediaStream([e.track]);
      audio.play().catch(() => this.game.notice('🔈 Tippe kurz auf den Bildschirm, damit du die anderen hörst', 4000));
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
