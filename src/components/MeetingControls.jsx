import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  MessageCircle,
  PhoneOff,
} from 'lucide-react';

const MeetingControls = ({
  currentUser,
  isScreenSharing,
  onMuteToggle,
  onVideoToggle,
  onScreenShare,
  onParticipantsToggle,
  onChatToggle,
  onLeaveCall,
  participantCount,
  meetingCode = '',
  unreadMessages = 0,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!currentUser) {
    return (
      <div className="bg-black px-4 py-3 flex items-center justify-center">
        <div className="text-white text-sm">Loading controls...</div>
      </div>
    );
  }

  const controlBtn =
    'p-2.5 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0';
  const iconSize = 18;

  return (
    <div className="bg-black px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 safe-bottom">
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="text-white text-sm font-medium truncate">
            {formatTime(currentTime)} | {meetingCode}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onMuteToggle}
            className={`${controlBtn} ${
              currentUser.isMuted
                ? 'bg-red-200 hover:bg-red-300'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={currentUser.isMuted ? 'Unmute' : 'Mute'}
          >
            {currentUser.isMuted ? (
              <MicOff size={20} className="text-red-600" />
            ) : (
              <Mic size={20} className="text-white" />
            )}
          </button>

          <button
            onClick={onVideoToggle}
            className={`${controlBtn} ${
              !currentUser.isVideoOn
                ? 'bg-red-200 hover:bg-red-300'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={!currentUser.isVideoOn ? 'Turn on camera' : 'Turn off camera'}
          >
            {!currentUser.isVideoOn ? (
              <VideoOff size={20} className="text-red-600" />
            ) : (
              <Video size={20} className="text-white" />
            )}
          </button>

          <button
            onClick={onScreenShare}
            className={`${controlBtn} relative ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <ScreenShare size={20} className="text-white" />
            {isScreenSharing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            onClick={onLeaveCall}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-all duration-200"
          >
            <PhoneOff size={20} className="text-white" />
          </button>
        </div>

        <div className="flex items-center gap-3 justify-end min-w-0 flex-1">
          <button
            onClick={onParticipantsToggle}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200"
          >
            <Users size={20} className="text-white" />
            <span className="text-white text-sm font-medium">{participantCount}</span>
          </button>

          <button
            onClick={onChatToggle}
            className="relative p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
          >
            <MessageCircle size={20} className="text-white" />
            {unreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / tablet controls */}
      <div className="flex md:hidden flex-col gap-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={onMuteToggle}
            className={`${controlBtn} ${
              currentUser.isMuted
                ? 'bg-red-200 hover:bg-red-300'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label={currentUser.isMuted ? 'Unmute' : 'Mute'}
          >
            {currentUser.isMuted ? (
              <MicOff size={iconSize} className="text-red-600" />
            ) : (
              <Mic size={iconSize} className="text-white" />
            )}
          </button>

          <button
            onClick={onVideoToggle}
            className={`${controlBtn} ${
              !currentUser.isVideoOn
                ? 'bg-red-200 hover:bg-red-300'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label={!currentUser.isVideoOn ? 'Turn on camera' : 'Turn off camera'}
          >
            {!currentUser.isVideoOn ? (
              <VideoOff size={iconSize} className="text-red-600" />
            ) : (
              <Video size={iconSize} className="text-white" />
            )}
          </button>

          <button
            onClick={onScreenShare}
            className={`${controlBtn} relative ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label="Screen share"
          >
            <ScreenShare size={iconSize} className="text-white" />
          </button>

          <button
            onClick={onParticipantsToggle}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200"
            aria-label="Participants"
          >
            <Users size={iconSize} className="text-white" />
            <span className="text-white text-xs font-medium">{participantCount}</span>
          </button>

          <button
            onClick={onChatToggle}
            className="relative p-2.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
            aria-label="Chat"
          >
            <MessageCircle size={iconSize} className="text-white" />
            {unreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </div>
            )}
          </button>

          <button
            onClick={onLeaveCall}
            className="p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all duration-200"
            aria-label="Leave call"
          >
            <PhoneOff size={iconSize} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;
