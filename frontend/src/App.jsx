import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChatbotPage from './pages/ChatbotPage';
import ShcPage from './pages/ShcPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shc" element={<ShcPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
