import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ChatbotPage.css';

const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Krishi Mitra AI assistant. How can I help you with farming today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sample responses for the chatbot
  const botResponses = {
    'hello': "Hello! How can I assist you with your farming needs today?",
    'weather': "I can help you with weather information for your location. Please share your location or check the weather widget on our dashboard.",
    'crop': "I can provide information about various crops, their growing conditions, and best practices. What specific crop would you like to know about?",
    'fertilizer': "For fertilizer recommendations, I'll need to know your soil type, crop, and current soil conditions. Would you like to take a soil test?",
    'pest': "I can help identify pests and suggest organic or chemical control methods. Can you describe the pest or share a photo?",
    'irrigation': "I can help you with irrigation scheduling and water management. What type of irrigation system are you using?",
    'soil': "I can help you understand soil health and provide recommendations for soil improvement. Would you like to know about soil testing?",
    'harvest': "I can help you determine the best time to harvest your crops. What crop are you planning to harvest?",
    'market': "I can provide information about current market prices and trends. Which crop's market information do you need?",
    'technology': "I can help you learn about modern farming technologies like precision agriculture, IoT sensors, and smart farming solutions.",
    'organic': "I can guide you through organic farming practices, certification processes, and natural pest control methods.",
    'help': "I can help you with: weather information, crop advice, pest control, soil management, irrigation, harvesting, market prices, and farming technology. What would you like to know?"
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords in the message
    for (const [keyword, response] of Object.entries(botResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    // Default responses
    const defaultResponses = [
      "That's an interesting question! Let me help you with that. Could you provide more details?",
      "I understand you're asking about farming. Let me connect you with the right information.",
      "I'm here to help with your farming queries. Could you be more specific about what you need?",
      "That's a great farming question! I'd be happy to help you with more details.",
      "I can assist you with various farming topics. What specific aspect would you like to explore?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat/user-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, aadharNumber: user?.aadharNumber })
      });

      const data = await res.json();

      const botResponse = {
        id: userMessage.id + 1,
        text: res.ok ? JSON.stringify(data, null, 2) : (data?.error || 'Server error'),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      const botResponse = {
        id: userMessage.id + 1,
        text: 'Network error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickReplies = [
    "Pre-Sowing Advice",
    "Sowing Advice",
    "Crop Monitoring Advice",
    "Scheme Advice ",
    "Market Prices Advice ",
    "Farmer's Rights Advice"
  ];

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
  };

  return (
    <div className="chatbot-page">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/main-video.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
      <div className="chatbot-container">
        <div className="chatbot-header">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span>
            Back to Home
          </Link>
          <div className="chatbot-title">
            <span className="chatbot-icon"><img src="../assets/assistant.webp" alt="" /></span>
            <h1>Krishi Mitra AI Assistant</h1>
            <p>Your farming companion</p>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                {message.sender === 'bot' && (
                  <div className="bot-avatar">🌱</div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="bot-avatar">🌱</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-replies">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                className="quick-reply-btn"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="chat-input-container">
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about farming..."
                className="chat-input"
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="send-btn"
              >
                <span className="send-icon">📤</span>
              </button>
            </div>
          </div>
        </div>

        
      </div>

      {/* Background video used instead of patterned background */}
    </div>
  );
};

export default ChatbotPage;
