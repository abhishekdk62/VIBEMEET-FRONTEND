import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoGrid from "../components/VideoGrid.jsx";
import MeetingControls from "../components/MeetingControls.jsx";
import ParticipantsSidebar from "../components/ParticipantsSidebar.jsx";
import ChatSidebar from "../components/ChatSidebar.jsx";
import webrtcService from "../services/webRtcServices.js";
import ParticipantActions from "../components/ParticipantActions.jsx";
import socketService from "../services/socketService.js";
import { getMeeting, leaveMeeting } from "../services/meetingService.js";
import toast from "react-hot-toast";

const VideoCall = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantActions, setShowParticipantActions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const localVideoRef = useRef(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (meetingId && !isInitializing.current && !webrtcService.isInitialized) {
      isInitializing.current = true;
      initializeMeeting(isMounted);
    }

    return () => {
      isMounted = false;
      if (isInitializing.current) {
        cleanup();
      }
    };
  }, [meetingId]);

  const waitForSocketConnection = (socket) => {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.error("Socket connection timeout");
        reject(new Error("Socket connection timeout"));
      }, 15000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        setTimeout(() => {
          resolve();
        }, 100);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        clearTimeout(timeout);
        reject(new Error("Socket connection failed: " + error.message));
      });
    });
  };

  const handleParticipantAction = (participantId, action) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) {
      console.error("Participant not found:", participantId);
      return;
    }

    switch (action) {
      case "mute":
        socketService.hostMuteParticipant(meetingId, participant.socketId);
        break;
      case "unmute":
        socketService.hostUnmuteParticipant(meetingId, participant.socketId);
        break;
      case "disableVideo":
        socketService.hostDisableVideo(meetingId, participant.socketId);
        break;
      case "enableVideo":
        socketService.hostEnableVideo(meetingId, participant.socketId);
        break;
      case "remove":
        if (confirm(`Remove ${participant.name} from the meeting?`)) {
          socketService.removeParticipant(meetingId, participant.socketId);
        }
        break;
      default:
        console.warn("Unknown action:", action);
    }

    setShowParticipantActions(false);
  };

  const initializeMeeting = async (isMounted = true) => {
    try {
      console.log("🚀 Starting meeting initialization...");

      const token = localStorage.getItem("token");
      const userDataString = localStorage.getItem("user");

      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!userDataString) {
        throw new Error(
          "No user data found in localStorage. Please login again."
        );
      }

      let userData;
      try {
        userData = JSON.parse(userDataString);
        console.log("📋 User data parsed:", userData);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        throw new Error(
          "Invalid user data in localStorage. Please login again."
        );
      }

      const userId = userData.id || userData._id || userData.userId;

      if (!userId) {
        console.error("Available user data fields:", Object.keys(userData));
        throw new Error(
          "User ID not found in any expected field. Please login again."
        );
      }

      console.log("👤 User ID extracted:", userId);

      console.log("🔍 Fetching meeting data...");
      const meetingData = await getMeeting(meetingId);

      if (!isMounted) return;

      if (!meetingData) {
        throw new Error("Meeting not found - check if meeting ID is correct");
      }

      if (meetingData.status === "ended") {
        throw new Error("Meeting has already ended");
      }

      console.log("📅 Meeting data retrieved:", meetingData);
      setMeeting(meetingData);

      console.log("🔌 Initializing socket connection...");
      const socket = webrtcService.initializeSocket(token);

      if (!socket) {
        throw new Error("Failed to initialize socket connection");
      }

      await waitForSocketConnection(socket);

      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        const connectionStatus = socketService.getConnectionStatus();

        if (socketService.socket && connectionStatus.isConnected) {
          console.log("✅ Socket connection established");
          break;
        }

        if (retries === maxRetries - 1) {
          throw new Error(
            "Socket not properly set in socket service after multiple attempts"
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        retries++;
      }

      try {
        const stream = await webrtcService.getUserMedia();
        if (!isMounted) return;

        console.log("✅ User media obtained successfully");
        console.log("🎬 Stream details:", {
          id: stream.id,
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
          active: stream.active,
        });

        if (!webrtcService.localStream) {
          console.error("❌ Stream not set in WebRTC service!");
          throw new Error(
            "Failed to initialize media stream in WebRTC service"
          );
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("📺 Local video element updated");
        }

        const isHost = meetingData.hostId._id.toString() === userId.toString();

        console.log("👑 Host check:", {
          hostId: meetingData.hostId.toString(),
          userId: userId.toString(),
          isHost: isHost,
        });

        const userName =
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          userData.email ||
          userData.name ||
          "You";

        console.log("🏷️ User name resolved:", userName);

        const currentUserData = {
          id: userId,
          socketId: webrtcService.socket?.id,
          name: userName,
          isHost,
          isMuted: false,
          isVideoOn: true,
          hostMuted: false,
          hostDisabledVideo: false,
          isCurrentUser: true,
          stream,
          avatar: (
            userData.firstName?.charAt(0) ||
            userData.name?.charAt(0) ||
            userData.email?.charAt(0) ||
            "U"
          ).toUpperCase(),
        };

        console.log("👤 Setting current user:", currentUserData);
        setCurrentUser(currentUserData);

        console.log("🔧 Setting up socket listeners...");
        setupSocketListeners();

        console.log("🚪 Joining meeting...");
        const joinSuccessful = socketService.joinMeeting(
          meetingId,
          userId,
          userName,
          isHost
        );

        if (!joinSuccessful) {
          throw new Error(
            "Failed to join meeting - socket service returned false"
          );
        }

        console.log("⏳ Waiting for join confirmation...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        toast(`Please share your meeting id ${meetingId} for others to join`);

        console.log("🎉 Meeting initialization completed successfully!");
      } catch (mediaError) {
        console.error("❌ Media access error:", mediaError);

        if (mediaError.name === "NotAllowedError") {
          throw new Error(
            "Camera/microphone access denied. Please allow permissions and try again."
          );
        } else if (mediaError.name === "NotFoundError") {
          throw new Error(
            "No camera or microphone found. Please check your devices."
          );
        } else if (mediaError.name === "NotReadableError") {
          throw new Error(
            "Camera or microphone is being used by another application."
          );
        } else {
          throw new Error(`Media access failed: ${mediaError.message}`);
        }
      }
    } catch (error) {
      console.error("=== Error in initializeMeeting ===", {
        message: error.message,
        stack: error.stack,
        meetingId,
        timestamp: new Date().toISOString(),
      });

      if (isMounted) {
        let errorMessage = "Failed to join meeting. ";

        if (error.message.includes("token")) {
          errorMessage += "Authentication issue. Please login again.";
        } else if (error.message.includes("socket")) {
          errorMessage += "Connection issue. Please check your internet.";
        } else if (
          error.message.includes("media") ||
          error.message.includes("Camera") ||
          error.message.includes("microphone")
        ) {
          errorMessage += error.message;
        } else if (
          error.message.includes("User ID") ||
          error.message.includes("user data") ||
          error.message.includes("localStorage")
        ) {
          errorMessage += "Session expired. Please login again.";
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        } else {
          errorMessage += "Please try again.";
        }
        toast.error(errorMessage);

        navigate("/dashboard");
      }
    }
  };

  // ✅ FIXED: mapParticipant NOW includes stream
  const mapParticipant = (p) => {
    return {
      id: p.userId || p.id,
      socketId: p.socketId,
      name: p.userName || p.name,
      isHost: p.isHost || false,
      isMuted: !p.audioEnabled,
      isVideoOn: p.videoEnabled,
      isCurrentUser: false,
      stream: null, // ✅ CRITICAL - will be filled by ontrack
      avatar: (p.userName || p.name || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    };  
  };

  // ✅ FIXED: Complete setupPeerConnectionEvents with all logging
  const setupPeerConnectionEvents = (peerConnection, socketId) => {
    console.log(`🔧 Setting up peer connection events for ${socketId}`);

    peerConnection.ontrack = (event) => {
      console.log(`🎬 [ontrack] Remote stream received from ${socketId}:`, {
        kind: event.track.kind,
        trackState: event.track.readyState,
        streamCount: event.streams.length,
        audioTracks: event.streams[0]?.getAudioTracks().length,
        videoTracks: event.streams[0]?.getVideoTracks().length,
      });

      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];

        console.log(`📦 Updating stream for socketId: ${socketId}`, {
          streamId: remoteStream.id,
          active: remoteStream.active,
        });

        setParticipants((prev) => {
          const updated = prev.map((p) => {
            if (p.socketId === socketId) {
              console.log(`✅ Setting stream for ${p.name}`);
              return { ...p, stream: remoteStream };
            }
            return p;
          });
          return updated;
        });
      } else {
        console.error(`❌ No streams in ontrack event for ${socketId}`);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ICE Candidate from ${socketId}:`, {
          type: event.candidate.type,
        });
        webrtcService.socket.emit("webrtc-ice-candidate", {
          targetSocketId: socketId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `🧊 ICE Connection State [${socketId}]: ${peerConnection.iceConnectionState}`
      );
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        `🔗 Connection State [${socketId}]: ${peerConnection.connectionState}`
      );
    };
  };

  // ✅ FIXED: Complete setupSocketListeners with all logging
  const setupSocketListeners = () => {
    const callbacks = {
      onParticipantsList: ({ participants: serverParticipants }) => {
        if (!serverParticipants || !Array.isArray(serverParticipants)) {
          console.error("❌ Invalid participants data received");
          setIsConnecting(false);
          return;
        }

        console.log("👥 Participants list received:", serverParticipants.length);

        const filteredParticipants = serverParticipants.filter((p) => {
          const isCurrentUser = p.socketId === webrtcService.socket?.id;
          return !isCurrentUser;
        });

        const mappedParticipants = filteredParticipants.map((p) => {
          const mapped = mapParticipant(p);
          return mapped;
        });

        setParticipants(mappedParticipants);
        setIsConnecting(false);

        console.log("🔗 Creating peer connections for", mappedParticipants.length);

        mappedParticipants.forEach((participant) => {
          if (!webrtcService.peerConnections.has(participant.socketId)) {
            const peerConnection = webrtcService.createPeerConnection(
              participant.socketId
            );
            setupPeerConnectionEvents(peerConnection, participant.socketId);
          }
        });
      },

      onParticipantJoined: ({ participant }) => {
        if (!participant) {
          console.error("❌ No participant data received");
          return;
        }

        console.log("➕ Participant joined:", {
          name: participant.userName,
          socketId: participant.socketId,
        });

        const newParticipant = mapParticipant(participant);

        setParticipants((prev) => {
          const isDuplicate = prev.some(
            (p) => p.socketId === participant.socketId
          );
          if (isDuplicate) {
            console.warn(
              "⚠️ Participant already exists:",
              participant.socketId
            );
            return prev;
          }

          const updated = [...prev, newParticipant];
          return updated;
        });

        if (!webrtcService.peerConnections.has(participant.socketId)) {
          console.log("🔗 Creating peer connection for new participant");
          const peerConnection = webrtcService.createPeerConnection(
            participant.socketId
          );
          setupPeerConnectionEvents(peerConnection, participant.socketId);

          setTimeout(() => {
            console.log("📤 Creating offer for", participant.socketId);
            webrtcService.createOffer(participant.socketId, meetingId);
          }, 100);
        }
      },

      onParticipantLeft: ({ socketId }) => {
        console.log("➖ Participant left:", socketId);
        setParticipants((prev) => {
          const updated = prev.filter((p) => p.socketId !== socketId);
          return updated;
        });

        webrtcService.closePeerConnection(socketId);
      },

      onWebRTCOffer: async ({ offer, from }) => {
        console.log(`📥 [onWebRTCOffer] Received offer from ${from}`);
        await webrtcService.handleOffer(offer, from);
      },

      onWebRTCAnswer: async ({ answer, from }) => {
        console.log(`📥 [onWebRTCAnswer] Received answer from ${from}`);
        await webrtcService.handleAnswer(answer, from);
      },

      onWebRTCIceCandidate: ({ candidate, from }) => {
        console.log(`🧊 [onWebRTCIceCandidate] Received from ${from}`);
        webrtcService.handleIceCandidate(candidate, from);
      },

      onVideoToggle: ({ socketId, videoEnabled }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.socketId === socketId ? { ...p, isVideoOn: videoEnabled } : p
          )
        );
      },

      onAudioToggle: ({ socketId, audioEnabled }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.socketId === socketId ? { ...p, isMuted: !audioEnabled } : p
          )
        );
      },

      onScreenShareStart: ({ socketId, userName, shareType }) => {
        console.log(`📺 ${userName} started screen sharing (${shareType})`);
        setParticipants((prev) =>
          prev.map((p) =>
            p.socketId === socketId
              ? {
                  ...p,
                  isScreenSharing: true,
                  screenShareType: shareType,
                }
              : p
          )
        );
      },

      onScreenShareStop: ({ socketId, userName }) => {
        console.log(`📺 ${userName} stopped screen sharing`);
        setParticipants((prev) =>
          prev.map((p) =>
            p.socketId === socketId
              ? {
                  ...p,
                  isScreenSharing: false,
                  screenShareType: null,
                }
              : p
          )
        );
      },

      onScreenShareError: ({ error, socketId }) => {
        console.error("Screen share error from participant:", error);
        if (socketId === webrtcService.socket?.id) {
          toast.error("Screen sharing failed");
        }
      },

      onNewMessage: (messageData) => {
        console.log("📨 New message received in video call:", messageData);
        if (!showChat) {
          setUnreadMessages((prev) => prev + 1);
        }
      },

      onMeetingEnded: () => {
        toast("Meeting has ended!", { icon: "👏" });
        navigate("/dashboard");
      },

      onJoinedSuccessfully: () => {
        setIsConnecting(false);
      },

      onJoinError: (error) => {
        console.error("❌ Join error:", error);
        toast.error("Failed to join meeting");
        navigate("/dashboard");
      },

      onHostMutedYou: () => {
        if (webrtcService.localStream) {
          const audioTracks = webrtcService.localStream.getAudioTracks();
          audioTracks.forEach((track) => {
            track.enabled = false;
          });
        }

        setCurrentUser((prev) => ({
          ...prev,
          isMuted: true,
          hostMuted: true,
        }));
        toast("Host has muted you!");
      },

      onHostUnmutedYou: () => {
        setCurrentUser((prev) => ({
          ...prev,
          hostMuted: false,
        }));
        toast("Host has given you permission to unmute!", { icon: "👏" });
      },

      onHostDisabledVideo: () => {
        if (webrtcService.localStream) {
          const videoTracks = webrtcService.localStream.getVideoTracks();
          videoTracks.forEach((track) => {
            track.enabled = false;
          });
        }

        setCurrentUser((prev) => ({
          ...prev,
          isVideoOn: false,
          hostDisabledVideo: true,
        }));

        toast("Host has disabled your video!", { icon: "👏" });
      },

      onHostEnabledVideo: () => {
        setCurrentUser((prev) => ({
          ...prev,
          hostDisabledVideo: false,
        }));
        toast("Host has given you permission to turn on video!", { icon: "👏" });
      },

      onRemovedFromMeeting: (data) => {
        toast("You have been removed from the meeting by the host!");
        navigate("/dashboard");
      },
    };

    socketService.setupListeners(callbacks);
  };

  const handleMuteToggle = useCallback(() => {
    console.log("🔊 handleMuteToggle called");

    if (!currentUser) {
      console.warn("❌ No current user available");
      return;
    }

    if (!webrtcService.validateLocalStream()) {
      console.error("❌ Local stream validation failed");
      toast.error("Media stream not available");
      return;
    }

    if (currentUser.isHost || !currentUser.hostMuted) {
      try {
        const audioEnabled = webrtcService.toggleAudio();
        console.log("✅ Audio toggled to:", audioEnabled);

        setCurrentUser((prev) => ({
          ...prev,
          isMuted: !audioEnabled,
        }));

        socketService.toggleAudio(meetingId, audioEnabled);
      } catch (error) {
        console.error("❌ Error toggling audio:", error);
        toast.error("Failed to toggle audio. Please try again");
      }
    } else {
      toast.error("Host has muted you. You cannot unmute yourself");
    }
  }, [currentUser, meetingId]);

  const handleVideoToggle = useCallback(() => {
    console.log("handleVideoToggle called");

    if (!currentUser) {
      console.warn("No current user available");
      return;
    }

    if (!webrtcService.localStream) {
      console.warn("WebRTC service has no local stream");
      toast.error("Media not ready yet. Please wait a moment and try again.");
      return;
    }

    if (currentUser.isHost || !currentUser.hostDisabledVideo) {
      try {
        const videoEnabled = webrtcService.toggleVideo();
        console.log("Video toggled to:", videoEnabled);

        setCurrentUser((prev) => ({
          ...prev,
          isVideoOn: videoEnabled,
        }));

        socketService.toggleVideo(meetingId, videoEnabled);
      } catch (error) {
        console.error("Error toggling video:", error);
        toast.error("Failed to toggle video. Please try again");
      }
    } else {
      toast.error("Host has disabled your video");
    }
  }, [currentUser, meetingId]);

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        console.log("🎬 Starting screen share with camera...");
        await webrtcService.startScreenShareWithCamera();
        setIsScreenSharing(true);

        const userName = currentUser?.name || "You";
        socketService.startScreenShare(meetingId);

        console.log("✅ Screen share with camera started");
      } else {
        console.log("🛑 Stopping screen share with camera...");
        const result = await webrtcService.stopScreenShareWithCamera();
        setIsScreenSharing(false);

        if (localVideoRef.current && result.stream) {
          localVideoRef.current.srcObject = result.stream;
          console.log("✅ Local video element updated with camera stream");
        }

        socketService.stopScreenShare(meetingId);

        console.log("✅ Screen share with camera stopped");
      }
    } catch (error) {
      console.error("❌ Screen share error:", error);
      toast.error("Screen sharing failed. Please try again.");
      setIsScreenSharing(false);
    }
  };

  const handleLeaveCall = async () => {
    try {
      const userDataString = localStorage.getItem("user");
      if (!userDataString) {
        console.warn("No user data found for leave call");
        navigate("/dashboard");
        return;
      }

      const userData = JSON.parse(userDataString);
      const userId = userData.id || userData._id || userData.userId;

      socketService.leaveMeeting();

      if (userId) {
        await leaveMeeting(meetingId, userId);
      }
    } catch (error) {
      console.error("Error leaving meeting:", error);
    }

    navigate("/dashboard");
  };

  const cleanup = () => {
    isInitializing.current = false;
    webrtcService.cleanup();
  };

  // ✅ Debug function
  const handleDebugConnection = () => {
    console.log("========== 🔍 FULL DEBUG ==========");

    // 1. Check local stream
    console.log("1️⃣ LOCAL STREAM:");
    if (webrtcService.localStream) {
      console.log("✅ Local stream exists:", {
        id: webrtcService.localStream.id,
        videoTracks: webrtcService.localStream.getVideoTracks().length,
        audioTracks: webrtcService.localStream.getAudioTracks().length,
        active: webrtcService.localStream.active,
        videoEnabled: webrtcService.localStream.getVideoTracks()[0]?.enabled,
        audioEnabled: webrtcService.localStream.getAudioTracks()[0]?.enabled,
      });
    } else {
      console.error("❌ NO LOCAL STREAM!");
    }

    // 2. Check peer connections
    console.log("\n2️⃣ PEER CONNECTIONS:");
    console.log(`Total peer connections: ${webrtcService.peerConnections.size}`);

    webrtcService.peerConnections.forEach((pc, socketId) => {
      console.log(`\n🔗 Peer ${socketId}:`, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
        senders: pc.getSenders().map((s) => ({
          kind: s.track?.kind,
          enabled: s.track?.enabled,
          state: s.track?.readyState,
        })),
        receivers: pc.getReceivers().map((r) => ({
          kind: r.track?.kind,
          enabled: r.track?.enabled,
          state: r.track?.readyState,
        })),
      });
    });

    // 3. Check participants state
    console.log("\n3️⃣ PARTICIPANTS STATE:");
    participants.forEach((p) => {
      console.log(`${p.name}:`, {
        hasStream: !!p.stream,
        streamId: p.stream?.id,
        videoOn: p.isVideoOn,
        audioOn: !p.isMuted,
        videoTracks: p.stream?.getVideoTracks().length,
        audioTracks: p.stream?.getAudioTracks().length,
      });
    });

    // 4. Check socket
    console.log("\n4️⃣ SOCKET:");
    console.log({
      connected: webrtcService.socket?.connected,
      socketId: webrtcService.socket?.id,
    });

    console.log("========== END DEBUG ==========");
  };

  if (isConnecting) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Connecting to meeting...</div>
      </div>
    );
  }

  const allParticipants = currentUser
    ? [currentUser, ...participants]
    : participants;

  const handleclick = (participant) => {
    if (currentUser?.isHost && !participant.isCurrentUser) {
      setSelectedParticipant(participant);
      setShowParticipantActions(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      <video ref={localVideoRef} autoPlay muted style={{ display: "none" }} />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative flex flex-col min-w-0">
          <div className="flex justify-between items-center p-2 bg-black bg-opacity-50 text-white text-xs z-10">
            <div className="bg-black bg-opacity-50 px-2 py-1 rounded">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              | {meetingId}
            </div>
            <div className="bg-black bg-opacity-50 px-2 py-1 rounded">
              {allParticipants.length} participant
              {allParticipants.length !== 1 ? "s" : ""}
            </div>
          </div>

          <button
            onClick={handleDebugConnection}
            className="fixed bottom-20 right-5 bg-purple-600 text-white px-4 py-2 rounded z-50"
          >
            🔍 Debug
          </button>

          <div className="flex-1 min-h-0">
            <VideoGrid
              participants={allParticipants}
              isScreenSharing={isScreenSharing}
              localStream={webrtcService.localStream}
              onParticipantClick={handleclick}
            />
          </div>
        </div>

        {(showParticipants || showChat) && (
          <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
            {showParticipants && (
              <ParticipantsSidebar
                participants={allParticipants}
                currentUser={currentUser}
                onClose={() => setShowParticipants(false)}
                onParticipantAction={handleParticipantAction}
              />
            )}
            {showChat && (
              <ChatSidebar
                onClose={() => setShowChat(false)}
                currentUser={currentUser}
                meetingId={meetingId}
                socketService={socketService}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <MeetingControls
          currentUser={currentUser}
          isScreenSharing={isScreenSharing}
          onMuteToggle={handleMuteToggle}
          onVideoToggle={handleVideoToggle}
          onScreenShare={handleScreenShare}
          onParticipantsToggle={() => {
            setShowParticipants(!showParticipants);
            setShowChat(false);
          }}
          onChatToggle={() => {
            setShowChat(!showChat);
            setShowParticipants(false);
            if (!showChat) {
              setUnreadMessages(0);
            }
          }}
          onLeaveCall={handleLeaveCall}
          participantCount={allParticipants.length}
          meetingCode={meetingId}
          unreadMessages={unreadMessages}
        />
      </div>

      {showParticipantActions && selectedParticipant && currentUser?.isHost && (
        <ParticipantActions
          participant={selectedParticipant}
          onAction={handleParticipantAction}
          onClose={() => setShowParticipantActions(false)}
        />
      )}
    </div>
  );
};

export default VideoCall;
