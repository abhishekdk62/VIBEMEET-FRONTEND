import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

const VideoGrid = ({ participants, isScreenSharing, onParticipantClick }) => {
  const videoRefs = useRef({});

  // ✅ FIXED: Bind streams and handle audio/video playback
  useEffect(() => {
    participants.forEach((participant) => {
      const videoElement = videoRefs.current[participant.socketId || participant.id];

      if (!videoElement) return;

      // ✅ KEY FIX: Don't check isVideoOn - just check if stream exists!
      if (participant.stream) {
        if (videoElement.srcObject !== participant.stream) {
          console.log(`🎥 Binding stream for ${participant.name}:`, {
            streamId: participant.stream.id,
            videoTracks: participant.stream.getVideoTracks().length,
            audioTracks: participant.stream.getAudioTracks().length,
          });

          videoElement.srcObject = participant.stream;

          // ✅ FIX: Unmute for other participants to hear audio
          if (!participant.isCurrentUser) {
            videoElement.muted = false;
            videoElement.volume = 1.0;
          }

          // ✅ FIX: Force play video/audio
          videoElement
            .play()
            .then(() => {
              console.log(`▶️ [${participant.name}] Video playing with audio`);
            })
            .catch((error) => {
              console.warn(`⚠️ [${participant.name}] Play error:`, error.message);
              // Retry after delay
              setTimeout(() => {
                videoElement.play().catch(() => {});
              }, 500);
            });
        }
      }
    });
  }, [participants]);

  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  return (
    <div className="h-full w-full p-2">
      <div className={`grid gap-2 h-full w-full ${getGridClass(participants.length)}`}>
        {participants.map((participant) => (
          <div
            key={participant.socketId || participant.id}
            className="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 min-h-0 min-w-0"
            onClick={() => onParticipantClick(participant)}
          >
            {/* ✅ FIX: Show video element if stream exists (ignore isVideoOn) */}
            {participant.stream ? (
              <>
                <video
                  autoPlay
                  playsInline
                  muted={participant.isCurrentUser}  // ✅ Only mute self
                  className="w-full h-full object-cover rounded-lg bg-black"
                  ref={(videoRef) => {
                    if (videoRef) {
                      videoRefs.current[participant.socketId || participant.id] = videoRef;
                    }
                  }}
                />
                {/* Debug indicator */}
                <div className="absolute top-2 left-2 text-xs bg-green-600 text-white px-2 py-1 rounded z-20">
                  ✅ Stream
                </div>
              </>
            ) : (
              /* Only show avatar if NO stream */
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      participants.length <= 4
                        ? 'w-16 h-16'
                        : participants.length <= 9
                          ? 'w-12 h-12'
                          : 'w-8 h-8'
                    }`}
                  >
                    <span
                      className={`text-white font-medium ${
                        participants.length <= 4
                          ? 'text-xl'
                          : participants.length <= 9
                            ? 'text-lg'
                            : 'text-sm'
                      }`}
                    >
                      {participant.avatar || participant.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div
                    className={`text-white ${
                      participants.length <= 4 ? 'text-sm' : 'text-xs'
                    }`}
                  >
                    Waiting for stream...
                  </div>
                </div>
              </div>
            )}

            {/* Screen sharing indicator */}
            {participant.isCurrentUser && isScreenSharing && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 z-10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Screen + Camera
              </div>
            )}

            {/* Host Badge */}
            {participant.isHost && (
              <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs z-10">
                👑 Host
              </div>
            )}

            {/* Participant Name */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs z-10">
              {participant.name}
              {participant.isCurrentUser && ' (You)'}
            </div>

            {/* Status indicators */}
            <div className="absolute bottom-2 right-2 flex gap-1 z-10">
              {participant.isMuted && (
                <div className="bg-red-600 p-1 rounded" title="Muted">
                  <MicOff size={12} className="text-white" />
                </div>
              )}
              {!participant.isVideoOn && (
                <div className="bg-red--600 p-1 rounded" title="Video Off">
                  <VideoOff size={12} className="text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
