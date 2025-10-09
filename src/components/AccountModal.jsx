import React, { useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { googleSignUp } from "../services/userServices";
import toast from "react-hot-toast";
import { User, Settings, LogOut, UserCircle } from "lucide-react";

const AccountModal = ({ onClose, onLogout, getUserMeetings }) => {
  const modalRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const getDisplayName = () => {
    if (!user) return "User";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.email || "User";
  };

  const getInitial = () => {
    if (!user) return null;
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return null;
  };

  const getUserEmail = () => {
    return user?.email || "No email";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout successful");

    if (onLogout) onLogout();
    onClose();
  };

  const handleGoogleSignInSuccess = async (credentialResponse) => {
    try {
      const response = await googleSignUp(credentialResponse.credential);
      console.log(response);
      
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Google sign-in successful');
        onClose();
        getUserMeetings();
      }
    } catch (error) {
      toast.error('Google sign-in failed');
      console.error(error);
    }
  };

  const handleGoogleSignInError = () => {
    console.log("Google Sign-In Failed");
    toast.error("Google sign-in failed");
  };

  // If user is logged in, show user dropdown
  if (isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-start justify-end min-h-screen pt-16 pr-6">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl border border-gray-200 w-64 py-2 animate-in slide-in-from-top-2 duration-200"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                  {getInitial() ? (
                    <span className="text-sm font-semibold">
                      {getInitial()}
                    </span>
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {getUserEmail()}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3">
                <UserCircle size={16} className="text-gray-500" />
                <span>Profile</span>
              </button>

              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3">
                <Settings size={16} className="text-gray-500" />
                <span>Settings</span>
              </button>

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
              >
                <LogOut size={16} className="text-red-500" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Show Google sign-in only
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/20 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl border border-gray-200 p-8 w-full max-w-md relative animate-in zoom-in-95 duration-200"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Welcome
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-2">
              We only allow Google account sign-in to provide a more secure app flow.
            </p>
            <p className="text-gray-400 text-xs">
              Thank you for understanding
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSignInSuccess}
              onError={handleGoogleSignInError}
              size="large"
              theme="outline"
              text="signin_with"
              width="100%"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default AccountModal;
