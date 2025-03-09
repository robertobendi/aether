import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Verify from "./pages/Verify";
import { ToastProvider } from "./components/Toast";
import { initializeZkSystem } from './utils/zkUtils';

function App() {
  useEffect(() => {
    // Initialize the ZK system when the app loads
    initializeZkSystem();
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;