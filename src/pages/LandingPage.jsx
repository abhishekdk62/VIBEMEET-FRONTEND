import React, { useState, useEffect, useCallback } from "react";
import MainContent from "../components/MainContent";
import AccountModal from "../components/AccountModal";
import History from "../components/History";
import { useNavigate } from "react-router-dom";
import {
  createMeeting,
  getMeetings,
  joinMeeting,
} from "../services/meetingService";
import toast from "react-hot-toast";
import { LogIn, LogOut, User } from "lucide-react";
import StaggeredMenu from "../reactbits/Menu";
import About from "../components/About";
import { getUserId } from "../utils/user.js";

const getAuthState = () => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  if (!token || !userJson) {
    return { isLoggedIn: false, user: null, displayName: "", initial: "" };
  }
  try {
    const user = JSON.parse(userJson);
    const displayName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "User";
    const initial = user.firstName
      ? user.firstName.charAt(0).toUpperCase()
      : user.email
      ? user.email.charAt(0).toUpperCase()
      : "";
    return { isLoggedIn: true, user, displayName, initial };
  } catch {
    return { isLoggedIn: false, user: null, displayName: "", initial: "" };
  }
};

const LandingPage = () => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [auth, setAuth] = useState(getAuthState);
  const [currentView, setCurrentView] = useState("call");
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  const refreshAuth = useCallback(() => {
    setAuth(getAuthState());
  }, []);

  const menuItems = [
    {
      label: "Call",
      ariaLabel: "Make a call",
      onClick: () => setCurrentView("call"),
    },
    {
      label: "History",
      ariaLabel: "View call history",
      onClick: () => {
        setCurrentView("history");
      },
    },
    {
      label: "About",
      ariaLabel: "Learn more about VibeMeet",
      onClick: () => {
        setCurrentView("about");
      },
    },
  ];

  useEffect(() => {
    refreshAuth();
  }, [showAccountModal, refreshAuth]);

  const handleCreateMeeting = async () => {
    try {
      if (!auth.isLoggedIn) {
        toast.error("Please sign in first");
        setShowAccountModal(true);
        return;
      }
      const user = auth.user;
      const userName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "Host";

      const res = await createMeeting({
        title: `${userName}'s Meeting`,
      });
      navigate(`/call/${res.meetingId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting. Please try again");
    }
  };

  const getUserMeetings = async () => {
    try {
      const userJson = localStorage.getItem("user");
      const user = JSON.parse(userJson);
      const userId = getUserId(user);
      if (!userId) return;
      const data = await getMeetings(userId);
      setMeetings(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      getUserMeetings();
    }
  }, []);

  const handleJoinMeeting = async () => {
    try {
      if (!auth.isLoggedIn) {
        toast.error("Please sign in first");
        setShowAccountModal(true);
        return;
      }
      if (!joinCode.trim()) {
        toast.error("Enter a meeting code");
        return;
      }
      await joinMeeting(joinCode.trim());
      navigate(`/call/${joinCode.trim()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join meeting");
      console.log(error);
    }
  };

  const handleSignIn = () => {
    setShowAccountModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowAccountModal(false);
    setMeetings([]);
    refreshAuth();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-x-hidden">
      <StaggeredMenu
        position="left"
        isFixed={true}
        items={menuItems}
        displayItemNumbering={false}
        menuButtonColor="#000000"
        openMenuButtonColor="#000000"
        changeMenuColorOnOpen={true}
        colors={["#3B82F6", "#6366F1"]}
        accentColor="#3B82F6"
      />

      <div className="flex-1 bg-gray-100 flex flex-col min-h-screen min-w-0 w-full">
        <header className="relative z-30 flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white">
          {auth.isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {auth.initial || <User size={18} />}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                    {auth.displayName}
                  </p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn size={18} />
              <span>Sign in with Google</span>
            </button>
          )}
        </header>

        {currentView === "call" ? (
          <MainContent
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onCreateMeeting={handleCreateMeeting}
            onJoinMeeting={handleJoinMeeting}
          />
        ) : currentView === "history" ? (
          <History
            meetings={meetings}
            getUserMeetings={getUserMeetings}
            isLoggedIn={auth.isLoggedIn}
            onSignIn={handleSignIn}
          />
        ) : (
          <About />
        )}
      </div>

      {showAccountModal && !auth.isLoggedIn && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          onLoginSuccess={refreshAuth}
          getUserMeetings={getUserMeetings}
        />
      )}
    </div>
  );
};

export default LandingPage;
