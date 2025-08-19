import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const slides = [
    {
      key: 'pre-sowing',
      title: "Pre-Sowing Guidance",
      description: "Check soil, weather, and region to pick the best crop.\nPlan inputs smartly to save costs and boost yield.",
      backgroundImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop'
    },
    {
      key: 'sowing',
      title: "Sowing Assistance",
      description: "Get ideal sowing windows based on live weather.\nSeed rate and spacing tailored to your crop and field.",
      backgroundImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop'
    },
    {
      key: 'monitoring',
      title: "Crop Monitoring",
      description: "Detect pests, diseases, and stress early with AI.\nReceive timely tips for nutrition and irrigation.",
      backgroundImage: 'https://images.unsplash.com/photo-1532280733131-cb97c3e921c1?q=80&w=1600&auto=format&fit=crop'
    },
    {
      key: 'market',
      title: "Market Insights",
      description: "Track mandi prices and demand trends easily.\nChoose the best time and place to sell produce.",
      backgroundImage: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=1600&auto=format&fit=crop'
    },
    {
      key: 'schemes',
      title: "Government Schemes",
      description: "Discover schemes, subsidies, and eligibility.\nStep-by-step guidance to apply without hassle.",
      backgroundImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1600&auto=format&fit=crop'
    },
    {
      key: 'rights',
      title: "Farmer's Rights",
      description: "Know your rights, policies, and protections.\nStay informed to make confident decisions.",
      backgroundImage: 'https://images.unsplash.com/photo-1519092437326-bfd121eb53ae?q=80&w=1600&auto=format&fit=crop'
    }
  ];

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1200) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  const maxIndex = Math.max(0, slides.length - visibleCount);

  const next = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/chatbot');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-page">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/main-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
    <div className="video-overlay"></div>
      
      <div className="top-navbar">
        <div className="logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">Krishi Mitra</span>
        </div>
        <div className="nav-buttons">
          <Link to="/login" className="nav-btn login-btn">Login</Link>
          <Link to="/chatbot" className="nav-btn chatbot-btn">Chatbot</Link>
        </div>
      </div>
    <div className="maindisplay">
      <div className="hero-content">
        <h1 className="hero-title">Krishi Mitra</h1>
        <p className="hero-subtitle">Your farming companion</p>
        <p className="hero-description">At Krishi Mitra, we believe farming is not just about sowing seeds — it's about sowing hope, nurturing the soil, and reaping prosperity. Our platform combines real-time weather forecasts, AI-powered crop recommendations, and soil health insights to guide farmers at every step of the sowing journey. Whether you farm one acre or a hundred, Krishi Mitra is your trusted companion, helping you choose the right crop, at the right time, for the right yield. With us, you're not just growing crops — you're growing a future.</p>
        <button className="cta-button" onClick={handleGetStarted}>Get Started</button>
      </div>

      {/* Features Carousel */}
      <section className="features-carousel">
        <div className="carousel-header">
          <h2>What our Chatbot helps you with</h2>
        </div>
        <div className="carousel-wrapper">
          <button aria-label="Previous" className="carousel-nav prev" onClick={prev}>‹</button>
          <div className="carousel-viewport">
            <div
              className="carousel-inner"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
              {slides.map((slide) => (
                <div className="slide-card" key={slide.key} style={{ minWidth: `${95 / visibleCount}%` }}>
                  <div className="slide-bg" style={{ backgroundImage: `url(${slide.backgroundImage})` }} />
                  <div className="slide-overlay" />
                  <div className="slide-content">
                    <h3 className="slide-title">{slide.title}</h3>
                    {slide.description.split('\n').map((line, idx) => (
                      <p className="slide-text" key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button aria-label="Next" className="carousel-nav next" onClick={next}>›</button>
        </div>
      </section>
    </div>
    </div>
  );
};

export default LandingPage;
