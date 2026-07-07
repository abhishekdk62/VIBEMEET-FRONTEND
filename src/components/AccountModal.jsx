import React, { useEffect, useRef } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { googleSignUp } from "../services/userServices";
import toast from "react-hot-toast";

const AccountModal = ({ onClose, onLoginSuccess, getUserMeetings }) => {
  const modalRef = useRef(null);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleGoogleSignInSuccess = async (credentialResponse) => {
    try {
      const response = await googleSignUp(credentialResponse.credential);

      if (response.accessToken) {
        localStorage.setItem("token", response.accessToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        toast.success("Signed in successfully");
        onClose();
        if (onLoginSuccess) onLoginSuccess();
        if (getUserMeetings) getUserMeetings();
      }
    } catch (error) {
      toast.error("Sign in failed. Please try again.");
      console.error(error);
    }
  };

  const handleGoogleSignInError = () => {
    toast.error("Google sign-in was cancelled or failed");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 sm:p-8 w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to VibeMeet</h2>
            <p className="text-gray-600 text-sm">
              Use your Google account to create meetings, join calls, and view history.
            </p>
          </div>

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
