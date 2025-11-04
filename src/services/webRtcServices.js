import io from "socket.io-client";
import socketService from "./socketService.js";

class WebRTCService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.peerConnections = new Map();
    this.pendingCandidates = new Map();
    this.isInitialized = false;
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
    this.hostMuted = false;
    this.hostDisabledVideo = false;
  }

  initializeSocket(token) {
    if (this.socket && this.socket.connected) {
      console.warn("Socket already initialized and connected");
      return this.socket;
    }

    this.socket = io(
      import.meta.env.VITE_NODE_ENV == "dev"
        ? import.meta.env.VITE_SOCKET_URL_DEV
        : import.meta.env.VITE_SOCKET_URL_PROD,
      {
        auth: { token },
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 60000,
      }
    );

    socketService.setSocket(this.socket);
    this.isInitialized = true;
    return this.socket;
  }

  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      console.log("🎥 Getting user media with constraints:", constraints);

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, ...constraints.video },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          ...constraints.audio,
        },
      });

      console.log("✅ User media obtained:", {
        streamId: this.localStream.id,
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length,
        localStreamReference: !!this.localStream,
      });

      if (this.localStream.getAudioTracks().length > 0) {
        this.localStream.getAudioTracks()[0].enabled = this.isAudioEnabled;
        console.log("🔊 Audio track initialized:", this.isAudioEnabled);
      }
      if (this.localStream.getVideoTracks().length > 0) {
        this.localStream.getVideoTracks()[0].enabled = this.isVideoEnabled;
        console.log("📹 Video track initialized:", this.isVideoEnabled);
      }

      return this.localStream;
    } catch (error) {
      console.error("❌ Error accessing media devices:", error);
      this.localStream = null;
      throw error;
    }
  }
  createPeerConnection(socketId, isCaller = false) {
    if (this.peerConnections.has(socketId)) {
      const existing = this.peerConnections.get(socketId);
      if (
        existing.connectionState !== "closed" &&
        existing.connectionState !== "failed"
      ) {
        console.warn(
          `Peer connection already exists for ${socketId} with state: ${existing.connectionState}`
        );
        return existing;
      } else {
        this.closePeerConnection(socketId);
      }
    }
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        // STUN
        { urls: ["stun:stun.l.google.com:19302"] },
        { urls: ["stun:stun1.l.google.com:19302"] },
        { urls: ["stun:stun2.l.google.com:19302"] },
        { urls: ["stun:stun3.l.google.com:19302"] },
        { urls: ["stun:stun4.l.google.com:19302"] },
    
        // ✅ TURN Option 1: Metered.ca
        {
          urls: ["turn:a.relay.metered.ca:80", "turn:a.relay.metered.ca:443"],
          username: "d8b28b1539284ffc6a2c4667",
          credential: "iH+R9rSH9l1tXkT2",
        },
    
        // ✅ TURN Option 2: Metered.ca Backup
        {
          urls: ["turn:b.relay.metered.ca:80", "turn:b.relay.metered.ca:443"],
          username: "d8b28b1539284ffc6a2c4667",
          credential: "iH+R9rSH9l1tXkT2",
        },
    
        // ✅ TURN Option 3: OpenRelay (might work)
        {
          urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
    
        // ✅ TURN Option 4: Backup OpenRelay
        {
          urls: ["turn:openrelay.metered.ca:80?transport=tcp"],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
    });
    
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream);
      });
    }
  
    // ✅ CRITICAL: ICE CANDIDATE HANDLER
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 [${socketId}] ICE Candidate Type: ${event.candidate.type}`, {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
        });
        
        this.socket.emit("webrtc-ice-candidate", {
          targetSocketId: socketId,
          candidate: event.candidate,
        });
      } else {
        console.log(`🧊 [${socketId}] ICE Gathering Complete`);
      }
    };
  
    // ✅ TRACK HANDLER for receiving remote stream
    peerConnection.ontrack = (event) => {
      console.log(`🎬 [${socketId}] ontrack - Remote stream received`, {
        kind: event.track.kind,
        trackState: event.track.readyState,
      });
    };
  
    peerConnection.addEventListener("signalingstatechange", () => {
      console.log(
        `[${socketId}] Signaling state: ${peerConnection.signalingState}`
      );
    });
  
    peerConnection.addEventListener("connectionstatechange", () => {
      console.log(
        `[${socketId}] Connection state: ${peerConnection.connectionState}`
      );
  
      if (peerConnection.connectionState === "failed") {
        console.warn(`[${socketId}] Connection failed, attempting ICE restart`);
        peerConnection.restartIce();
      }
  
      if (peerConnection.connectionState === "closed") {
        this.closePeerConnection(socketId);
      }
    });
  
    peerConnection.addEventListener("iceconnectionstatechange", () => {
      console.log(
        `[${socketId}] ICE connection state: ${peerConnection.iceConnectionState}`
      );
    });
  
    this.peerConnections.set(socketId, peerConnection);
    return peerConnection;
  }
  

  async createOffer(socketId, meetingId) {
    const peerConnection = this.peerConnections.get(socketId);
    if (!peerConnection) {
      console.error(`[${socketId}] No peer connection found for offer`);
      return;
    }

    if (peerConnection.signalingState !== "stable") {
      console.warn(
        `[${socketId}] Cannot create offer, signaling state: ${peerConnection.signalingState}`
      );
      return;
    }

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);

      this.socket.emit("webrtc-offer", {
        meetingId,
        targetSocketId: socketId,
        offer: offer,
      });
    } catch (error) {
      console.error(`[${socketId}] Error creating offer:`, error);
      throw error;
    }
  }

  async handleOffer(offer, from) {
    let peerConnection = this.peerConnections.get(from);

    if (!peerConnection) {
      peerConnection = this.createPeerConnection(from, false);
    }

    try {
      const currentState = peerConnection.signalingState;

      if (currentState === "stable" || currentState === "have-local-offer") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await this.processQueuedCandidates(from);

        if (offer.type === "offer") {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          this.socket.emit("webrtc-answer", {
            targetSocketId: from,
            answer: answer,
          });
        }
      } else {
        console.warn(
          `[${from}] Cannot handle offer, wrong state: ${currentState}`
        );
      }
    } catch (error) {
      console.error(`[${from}] Error handling offer:`, error);
    }
  }

  async handleAnswer(answer, from) {
    const peerConnection = this.peerConnections.get(from);
    if (!peerConnection) {
      console.error(`[${from}] No peer connection found for answer`);
      return;
    }

    try {
      const currentState = peerConnection.signalingState;

      if (currentState === "have-local-offer") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await this.processQueuedCandidates(from);
      } else {
        console.warn(
          `[${from}] Cannot handle answer, wrong state: ${currentState}`
        );
      }
    } catch (error) {
      console.error(`[${from}] Error handling answer:`, error);
    }
  }

  handleIceCandidate(candidate, from) {
    const peerConnection = this.peerConnections.get(from);
    if (!peerConnection) {
      console.error(`[${from}] No peer connection found for ICE candidate`);
      return;
    }

    if (!peerConnection.remoteDescription) {
      if (!this.pendingCandidates.has(from)) {
        this.pendingCandidates.set(from, []);
      }
      this.pendingCandidates.get(from).push(candidate);
      return;
    }

    this.addIceCandidate(peerConnection, candidate, from);
  }

  async processQueuedCandidates(socketId) {
    const candidates = this.pendingCandidates.get(socketId);
    if (candidates && candidates.length > 0) {
      console.log(
        `[${socketId}] Processing ${candidates.length} queued candidates`
      );
      const peerConnection = this.peerConnections.get(socketId);
      for (const candidate of candidates) {
        await this.addIceCandidate(peerConnection, candidate, socketId);
      }

      this.pendingCandidates.delete(socketId);
    }
  }

  async addIceCandidate(peerConnection, candidate, from) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.warn(`[${from}] Failed to add ICE candidate:`, error.message);
    }
  }

  // ✅ FIXED: Removed duplicate toggleVideo, kept only ONE version
  toggleAudio() {
    console.log("🔊 toggleAudio called");
    console.log("🔊 localStream reference:", !!this.localStream);
    console.log(
      "localStream details:",
      this.localStream
        ? {
            id: this.localStream.id,
            active: this.localStream.active,
            audioTracks: this.localStream.getAudioTracks().length,
          }
        : "NULL"
    );

    if (!this.localStream) {
      console.warn("❌ No local stream available for audio toggle");
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("❌ No audio tracks available");
      return false;
    }

    if (this.hostMuted) {
      console.warn("❌ Cannot toggle audio - muted by host");
      return false;
    }

    const audioTrack = audioTracks[0];
    audioTrack.enabled = !audioTrack.enabled;
    this.isAudioEnabled = audioTrack.enabled;

    console.log(`✅ Audio ${audioTrack.enabled ? "enabled" : "disabled"}`);
    return audioTrack.enabled;
  }

  toggleVideo() {
    console.log("📹 toggleVideo called");
    console.log("📹 localStream reference:", !!this.localStream);
    console.log(
      "📹 localStream details:",
      this.localStream
        ? {
            id: this.localStream.id,
            active: this.localStream.active,
            videoTracks: this.localStream.getVideoTracks().length,
          }
        : "NULL"
    );

    if (!this.localStream) {
      console.warn("❌ No local stream available for video toggle");
      return false;
    }

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn("❌ No video tracks available");
      return false;
    }

    if (this.hostDisabledVideo) {
      console.warn("❌ Cannot toggle video - disabled by host");
      return false;
    }

    const videoTrack = videoTracks[0];
    videoTrack.enabled = !videoTrack.enabled;
    this.isVideoEnabled = videoTrack.enabled;

    console.log(`✅ Video ${videoTrack.enabled ? "enabled" : "disabled"}`);
    return videoTrack.enabled;
  }

  validateLocalStream() {
    console.log("🔍 Validating local stream...");
    console.log("🔍 localStream exists:", !!this.localStream);

    if (!this.localStream) {
      console.error("❌ localStream is null/undefined");
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();
    const videoTracks = this.localStream.getVideoTracks();

    console.log("🔍 Stream validation results:", {
      streamId: this.localStream.id,
      streamActive: this.localStream.active,
      audioTracksCount: audioTracks.length,
      videoTracksCount: videoTracks.length,
      audioTrackEnabled:
        audioTracks.length > 0 ? audioTracks[0].enabled : "N/A",
      videoTrackEnabled:
        videoTracks.length > 0 ? videoTracks[0].enabled : "N/A",
      audioTrackState:
        audioTracks.length > 0 ? audioTracks[0].readyState : "N/A",
      videoTrackState:
        videoTracks.length > 0 ? videoTracks[0].readyState : "N/A",
    });

    return true;
  }

  forceDisableAudio() {
    if (this.localStream && this.localStream.getAudioTracks().length > 0) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      this.isAudioEnabled = false;
      this.hostMuted = true;
      console.log("Audio force disabled by host");
    }
  }

  forceDisableVideo() {
    if (this.localStream && this.localStream.getVideoTracks().length > 0) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      this.isVideoEnabled = false;
      this.hostDisabledVideo = true;
      console.log("Video force disabled by host");
    }
  }

  allowUnmute() {
    this.hostMuted = false;
    console.log("Host has allowed unmuting");
  }

  allowVideoEnable() {
    this.hostDisabledVideo = false;
    console.log("Host has allowed video enabling");
  }

  getAudioEnabled() {
    if (!this.localStream || this.localStream.getAudioTracks().length === 0) {
      return false;
    }
    return this.localStream.getAudioTracks()[0].enabled;
  }

  getVideoEnabled() {
    if (!this.localStream || this.localStream.getVideoTracks().length === 0) {
      return false;
    }
    return this.localStream.getVideoTracks()[0].enabled;
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      for (const [socketId, peerConnection] of this.peerConnections) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(videoTrack);
          } catch (error) {
            console.error(`[${socketId}] Failed to start screen share:`, error);
          }
        }
      }

      videoTrack.onended = () => {
        this.stopScreenShare().catch((error) => {
          console.error("Error handling screen share end:", error);
        });
      };

      return { stream: screenStream, videoTrack };
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const videoTrack = cameraStream.getVideoTracks()[0];

      for (const [socketId, peerConnection] of this.peerConnections) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(videoTrack);
          } catch (error) {
            console.error(`[${socketId}] Failed to stop screen share:`, error);
          }
        }
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
      }
      this.localStream = cameraStream;

      return videoTrack;
    } catch (error) {
      console.error("Error stopping screen share:", error);
      throw error;
    }
  }

  async startScreenShareWithCamera() {
    try {
      console.log("🎬 Starting screen share with camera overlay...");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");

      const screenVideo = document.createElement("video");
      const cameraVideo = document.createElement("video");

      screenVideo.srcObject = screenStream;
      cameraVideo.srcObject = cameraStream;

      screenVideo.muted = true;
      cameraVideo.muted = true;

      await screenVideo.play();
      await cameraVideo.play();

      let animationId;

      const composite = () => {
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        const cameraWidth = 320;
        const cameraHeight = 240;
        const margin = 20;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
          canvas.width - cameraWidth - margin - 5,
          canvas.height - cameraHeight - margin - 5,
          cameraWidth + 10,
          cameraHeight + 10
        );

        ctx.drawImage(
          cameraVideo,
          canvas.width - cameraWidth - margin,
          canvas.height - cameraHeight - margin,
          cameraWidth,
          cameraHeight
        );

        animationId = requestAnimationFrame(composite);
      };

      composite();

      const compositeStream = canvas.captureStream(30);

      if (this.localStream && this.localStream.getAudioTracks().length > 0) {
        const micAudioTrack = this.localStream.getAudioTracks()[0];
        compositeStream.addTrack(micAudioTrack);
        console.log("✅ Added existing microphone audio to composite");
      } else {
        console.warn("⚠️ No microphone audio track found in localStream");
      }

      const videoTrack = compositeStream.getVideoTracks()[0];

      for (const [socketId, peerConnection] of this.peerConnections) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(videoTrack);
            console.log(`✅ Screen+camera composite sent to ${socketId}`);
          } catch (error) {
            console.error(`❌ Failed to send composite to ${socketId}:`, error);
          }
        }
      }

      this.screenStream = screenStream;
      this.cameraStream = cameraStream;
      this.compositeCanvas = canvas;
      this.compositeStream = compositeStream;
      this.screenVideo = screenVideo;
      this.cameraVideo = cameraVideo;
      this.animationId = animationId;

      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShareWithCamera().catch(console.error);
      };

      return { compositeStream, screenStream, cameraStream };
    } catch (error) {
      console.error("❌ Error starting screen share with camera:", error);
      throw error;
    }
  }

  async stopScreenShareWithCamera() {
    try {
      console.log("🛑 Stopping screen share with camera...");

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach((track) => track.stop());
        this.screenStream = null;
      }

      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach((track) => track.stop());
        this.cameraStream = null;
      }

      if (this.compositeStream) {
        this.compositeStream.getTracks().forEach((track) => track.stop());
        this.compositeStream = null;
      }

      if (this.screenVideo) {
        this.screenVideo.srcObject = null;
        this.screenVideo = null;
      }

      if (this.cameraVideo) {
        this.cameraVideo.srcObject = null;
        this.cameraVideo = null;
      }

      const newCameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (newCameraStream.getAudioTracks().length > 0) {
        newCameraStream.getAudioTracks()[0].enabled = this.isAudioEnabled;
      }
      if (newCameraStream.getVideoTracks().length > 0) {
        newCameraStream.getVideoTracks()[0].enabled = this.isVideoEnabled;
      }

      const videoTrack = newCameraStream.getVideoTracks()[0];
      const audioTrack = newCameraStream.getAudioTracks()[0];

      for (const [socketId, peerConnection] of this.peerConnections) {
        const senders = peerConnection.getSenders();

        const videoSender = senders.find(
          (s) => s.track && s.track.kind === "video"
        );
        if (videoSender) {
          try {
            await videoSender.replaceTrack(videoTrack);
            console.log(`✅ Camera video restored for ${socketId}`);
          } catch (error) {
            console.error(
              `❌ Failed to restore camera for ${socketId}:`,
              error
            );
          }
        }

        const audioSender = senders.find(
          (s) => s.track && s.track.kind === "audio"
        );
        if (audioSender) {
          try {
            await audioSender.replaceTrack(audioTrack);
            console.log(`✅ Camera audio restored for ${socketId}`);
          } catch (error) {
            console.error(`❌ Failed to restore audio for ${socketId}:`, error);
          }
        }
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
      }
      this.localStream = newCameraStream;

      this.compositeCanvas = null;

      return { videoTrack, audioTrack, stream: newCameraStream };
    } catch (error) {
      console.error("❌ Error stopping screen share with camera:", error);
      throw error;
    }
  }

  closePeerConnection(socketId) {
    const peerConnection = this.peerConnections.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(socketId);
      this.pendingCandidates.delete(socketId);
    }
  }

  getConnectionStatus() {
    const status = {
      isInitialized: this.isInitialized,
      hasSocket: !!this.socket,
      socketConnected: this.socket?.connected || false,
      hasLocalStream: !!this.localStream,
      peerConnectionCount: this.peerConnections.size,
      pendingCandidatesCount: this.pendingCandidates.size,
      isAudioEnabled: this.isAudioEnabled,
      isVideoEnabled: this.isVideoEnabled,
      hostMuted: this.hostMuted,
      hostDisabledVideo: this.hostDisabledVideo,
    };

    return status;
  }

  cleanup() {
    console.log("🧹 Cleaning up WebRTC service...");

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.screenStream = null;
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.cameraStream = null;
    }

    if (this.compositeStream) {
      this.compositeStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.compositeStream = null;
    }

    if (this.screenVideo) {
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }

    if (this.cameraVideo) {
      this.cameraVideo.srcObject = null;
      this.cameraVideo = null;
    }

    this.compositeCanvas = null;

    this.peerConnections.forEach((peerConnection, socketId) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
    this.pendingCandidates.clear();

    socketService.cleanup();

    this.socket = null;
    this.isInitialized = false;

    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
    this.hostMuted = false;
    this.hostDisabledVideo = false;
  }
}

export default new WebRTCService();
