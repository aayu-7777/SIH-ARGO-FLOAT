// App.jsx
import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import FloatComparison from "./components/FloatComparison";
import MapOverview from "./components/MapOverview";
import ChatBot from "./components/ChatBot";
import UploadAnalyze from "./components/UploadAnalyze";
import ExportNetCDF from "./components/ExportNetCDF";
import Landing from "./components/Landing";
import BGCGliderPage from "./components/BGCGliderPage";

// Navigation component
const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="app-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              ARGO Float Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/dashboard"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/dashboard"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/compare"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/compare"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              🔍 Compare
            </Link>
            <Link
              to="/map"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/map"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              🗺 Map
            </Link>
            <Link
              to="/chat"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/chat"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              🤖 AI Chat
            </Link>
            <Link
              to="/upload"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/upload"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              ⬆️ Upload Analyze
            </Link>
            <Link
              to="/export-nc"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/export-nc"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              ⬇️ Export NetCDF
            </Link>
            <Link
              to="/bgc-glider"
              className={`nav-link text-sm font-medium transition-colors ${
                location.pathname === "/bgc-glider"
                  ? "active"
                  : "inactive hover:bg-gray-100"
              }`}
            >
              🌊 BGC & Glider
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App component
function App() {
  const location = useLocation();
  
  // Special styling for different pages
  const isChatPage = location.pathname === '/chat';
  const isDarkPage = ['/dashboard', '/export-nc', '/upload', '/compare', '/map'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';
  
  const getPageClass = () => {
    if (isChatPage) return 'chat-page-container';
    if (isDarkPage) return 'dark-page-container';
    if (isLandingPage) return 'landing-page-container';
    return '';
  };
  
  const getBackgroundClass = () => {
    if (isChatPage || isDarkPage) return 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900';
    return 'bg-gray-50';
  };
  
  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      <Navigation />
      <div className={getPageClass()}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<FloatComparison />} />
          <Route path="/map" element={<MapOverview />} />
          <Route path="/chat" element={<ChatBot />} />
          <Route path="/upload" element={<UploadAnalyze />} />
          <Route path="/export-nc" element={<ExportNetCDF />} />
          <Route path="/bgc-glider" element={<BGCGliderPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
