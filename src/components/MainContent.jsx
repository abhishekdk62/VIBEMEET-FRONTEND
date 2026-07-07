import React from "react";
import Shuffle from "./../reactbits/Shuffle";

const MainContent = ({
  joinCode,
  setJoinCode,
  onCreateMeeting,
  onJoinMeeting,
}) => {
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinMeeting();
    }
  };

  return (
    <div className="flex-1 bg-teal-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full text-center px-2 sm:px-0">
        <div className="mb-8 sm:mb-12">
          <div className="overflow-hidden">
            <Shuffle
              style={{
                fontFamily: "'Press Start 2P', system-ui",
                fontWeight: 400,
                fontSize: "clamp(1.5rem, 8vw, 4rem)",
              }}
              text="vibemeet"
              shuffleDirection="right"
              duration={1.5}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power3.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={true}
              respectReducedMotion={true}
              loop={true}
            />
          </div>
          <div className="pt-6 sm:pt-8">
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-900 mb-3 sm:mb-4 px-2">
              Video calls and meetings for everyone
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 px-2">
              Connect, collaborate, and celebrate from anywhere with VibeMeet
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center items-stretch sm:items-center mb-8 sm:mb-12 w-full max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onCreateMeeting}
            className="w-full sm:w-auto bg-violet-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New meeting
          </button>

          <form
            onSubmit={handleJoinSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Enter a code or link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full sm:w-64 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <svg
                className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a2 2 0 012-2z"
                />
              </svg>
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                joinCode.trim()
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              Join
            </button>
          </form>
        </div>

        <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
          <p>Learn more about VibeMeet</p>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
