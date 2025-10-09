import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import VideoCall from "./pages/VideoCall";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {


  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/dashboard" element={<LandingPage />} />
          <Route path="/call/:meetingId" element={<VideoCall />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>

  );
}

export default App;
