import React from "react";
import { Clock, Video, Calendar } from "lucide-react";

const HistoryCompo = ({ meetings, getUserMeetings }) => {
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
    <div className="flex-1 p-8 bg-lime-100">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex justify-center mb-8">
          <h1 className="text-5xl pt-3  font-bold text-gray-900">Call History</h1>
          <button
            onClick={getUserMeetings}
            className="absolute right-0 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              No call history yet
            </h3>
            <p className="text-gray-500">Your past meetings will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {meeting.title || "Untitled Meeting"}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(meeting.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {meeting.duration
                            ? `${Math.floor(meeting.duration / 60)}m ${
                                meeting.duration % 60
                              }s`
                            : "No duration"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-xs text-gray-500 font-mono">
                        Meeting ID: {meeting.meetingId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                </div>

                {meeting.participants && meeting.participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
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
