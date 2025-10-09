import React, { useState, useEffect } from "react";
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
import { User } from "lucide-react";
import StaggeredMenu from "../reactbits/Menu";
import About from "../components/About";

const LandingPage = () => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const [currentView, setCurrentView] = useState("call");
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

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
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const initial = user.firstName
          ? user.firstName.charAt(0).toUpperCase()
          : user.email
          ? user.email.charAt(0).toUpperCase()
          : "";
        setUserInitial(initial);
      } catch {
        setUserInitial("");
      }
    }
  }, [showAccountModal]);

  const handleCreateMeeting = async () => {
    try {
      const userJson = localStorage.getItem("user");
      if (!userJson) {
        toast.error("Please login first");
        return;
      }
      const user = userJson ? JSON.parse(userJson) : {};
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
      const data = await getMeetings(user._id);
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
      const userJson = localStorage.getItem("user");
      if (!userJson) {
        toast.error("Please login first");
        return;
      }
      const res = await joinMeeting(joinCode);
      navigate(`/call/${joinCode}`);
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error);
    }
  };

  const handleAccountClick = () => {
    setShowAccountModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    setShowAccountModal(false);
    setUserInitial("");
    setMeetings([]);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-white flex relative">
      <div
        className="fixed top-0 left-0 z-50"
        style={{ height: "100vh", width: "auto" }}
      >
        <StaggeredMenu
          position="left"
          items={menuItems}
          displayItemNumbering={false}
          menuButtonColor="#000000"
          openMenuButtonColor="#000000"
          changeMenuColorOnOpen={true}
          colors={["#3B82F6", "#6366F1"]}
          accentColor="#3B82F6"
        />
      </div>

      <div className="flex-1 bg-gray-100 flex flex-col min-h-screen">
        <header className="flex items-center justify-end px-6 py-4 border-b border-gray-200">
          <button
            onClick={handleAccountClick}
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Open account modal"
          >
            {userInitial || <User size={20} />}
          </button>
        </header>

        {currentView === "call" ? (
          <MainContent
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onCreateMeeting={handleCreateMeeting}
            onJoinMeeting={handleJoinMeeting}
          />
        ) : currentView === "history" ? (
          <History meetings={meetings} getUserMeetings={getUserMeetings} />
        ) : (
          <About />
        )}
      </div>

      {showAccountModal && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          onLogout={handleLogout}
          getUserMeetings={getUserMeetings}
        />
      )}
    </div>
  );
};

export default LandingPage;
