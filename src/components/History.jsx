import React from "react";
import { Clock, Video, Calendar } from "lucide-react";

const HistoryCompo = ({ meetings, getUserMeetings, isLoggedIn, onSignIn }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 bg-lime-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Call History
          </h1>
          <button
            onClick={getUserMeetings}
            className="self-start sm:self-auto px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 sm:border-0"
          >
            Refresh
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg border border-gray-200 px-6">
            <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">
              Sign in to view your call history
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Your past meetings will appear here after you sign in.
            </p>
            <button
              onClick={onSignIn}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Sign in with Google
            </button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Video className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-600 mb-2">
              No call history yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Your past meetings will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
                      {meeting.title || "Untitled Meeting"}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(meeting.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {meeting.duration
                            ? `${Math.floor(meeting.duration / 60)}m ${
                                meeting.duration % 60
                              }s`
                            : "No duration"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3">
                      <span className="text-xs text-gray-500 font-mono break-all">
                        Meeting ID: {meeting.meetingId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`self-start px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      meeting.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : meeting.status === "active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {meeting.status || "Completed"}
                  </span>
                </div>

                {meeting.participants && meeting.participants.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Participants: {meeting.participants.length}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryCompo;
