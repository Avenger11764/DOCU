import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../config';

export default function LandingPage({ onGetStarted }) {
  const canvasRef = useRef(null);
  
  // Auth state variables
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeObserver = null;
    function syncSize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas.parentElement);
    }
    syncSize();

    let particles = [];
    const particleCount = 75;
    const connectionDistance = 120;
    const mouseRadius = 180;

    let mouse = { x: null, y: null };

    function init() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 2 + 1.5,
        });
      }
    }

    init();

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', init);

    let animationFrameId = null;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius) {
            const force = (mouseRadius - dist) / mouseRadius;
            p.x += (dx / dist) * force * 0.6;
            p.y += (dy / dist) * force * 0.6;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 83, 9, 0.7)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.55;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', init);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const handleParallax = (e) => {
      const { clientX, clientY } = e;
      
      document.querySelectorAll('.parallax-target').forEach(el => {
        const strength = parseFloat(el.getAttribute('data-parallax-strength')) || 20;
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;
        
        const moveX = (clientX - elCenterX) / strength;
        const moveY = (clientY - elCenterY) / strength;
        
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    const handleMouseLeave = () => {
      document.querySelectorAll('.parallax-target').forEach(el => {
        el.style.transform = `translate(0, 0)`;
      });
    };

    if (!isReducedMotion) {
      document.addEventListener('mousemove', handleParallax);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add('shadow-[0_2px_4px_rgba(0,0,0,0.04)]', 'bg-[#f9f9f9]/95');
        } else {
          nav.classList.remove('shadow-[0_2px_4px_rgba(0,0,0,0.04)]', 'bg-[#f9f9f9]/80');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-animation').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      observer.observe(el);
    });

    return () => {
      if (!isReducedMotion) {
        document.removeEventListener('mousemove', handleParallax);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;

    setAuthError(null);
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'login' ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('docu_token', data.token);
      localStorage.setItem('docu_username', data.user.username);

      setShowAuthModal(false);
      onGetStarted();
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthError(null);
    setUsernameInput('');
    setPasswordInput('');
    setShowPassword(false);
    setShowAuthModal(true);
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans overflow-x-hidden selection:bg-[#ffb77d] relative min-h-screen">
      
      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        .editorial-shadow-hover {
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02);
        }
        .ai-insight-border {
            border-left: 3px solid #D97706;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #dbc2b0;
            border-radius: 10px;
        }
        .button-premium {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .button-premium:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 10px 20px -5px rgba(141, 75, 0, 0.3);
        }
        .card-premium:hover {
            transform: translateY(-4px);
        }
        #hero-shader-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }
      `}} />

      <div id="hero-shader-container">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f9f9f9]/80 backdrop-blur-md border-b border-[#dbc2b0]/30 px-6 md:px-12 h-16 flex items-center justify-between transition-all duration-300">
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 cursor-pointer select-none">
          <span className="material-symbols-outlined text-[#D97706] text-3xl">description</span>
          <span className="font-bold text-xl tracking-tighter text-[#1a1c1c] uppercase">DOCU</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium text-[#545f73] hover:text-[#8d4b00] transition-colors" href="#about">About</a>
          <a className="text-sm font-medium text-[#545f73] hover:text-[#8d4b00] transition-colors" href="#features">Features</a>
          <a className="text-sm font-medium text-[#545f73] hover:text-[#8d4b00] transition-colors" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => openAuth('login')} className="text-sm font-medium text-[#545f73] hover:text-[#8d4b00] transition-colors">Login</button>
          <button onClick={() => openAuth('register')} className="bg-[#D97706] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity editorial-shadow">Get Started</button>
        </div>
      </nav>

      <main className="relative z-10">
        
        <section className="relative pt-32 pb-20 overflow-hidden min-h-[450px]">
          <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
            <div className="inline-block px-4 py-1.5 mb-4 bg-[#ffdcc3]/40 text-[#6e3900] rounded-full text-xs font-semibold uppercase tracking-widest">
              Editorial Intelligence Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#1a1c1c] max-w-4xl mx-auto mb-6 leading-tight">
              Analyze your documents with editorial precision.
            </h1>
            <p className="text-lg md:text-xl text-[#554336] max-w-2xl mx-auto mb-10 leading-relaxed">
              DOCU uses advanced AI to index, summarize, and query your research library with absolute clarity. Built for the modern analyst.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button onClick={() => openAuth('register')} className="button-premium bg-[#D97706] text-white px-8 py-3.5 rounded-xl font-bold text-lg editorial-shadow">
                Start Researching
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mb-20 relative">
          <div className="parallax-target relative rounded-xl overflow-hidden editorial-shadow bg-white border border-[#dbc2b0] p-2 md:p-4" data-parallax-strength="30">
            <div className="bg-[#eeeeee] rounded-lg aspect-video w-full overflow-hidden relative">
              <img 
                alt="Workspace with tablet showing DocuQuery interface" 
                className="w-full h-full object-cover cursor-pointer" 
                onClick={() => openAuth('register')}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtlaMDAeCrTxOJ0Z3P6cbyeQ-UxxH4IdZ6p3NaS3e7ADb8AseX7nW4Qz2BApRTr4sxJMPi0-mgqhWE1_yVLNYrl0Xi_prRpwccwsydM_5y81yvGq0cbf-kZNpviAQ7wPbt5Vo6Xoysyfa5UJk5LGjF58CoHzvLpC8Srer0ZvF8CMcTxJWeVJzHSSMvnnwhFII49_TYGflLxhrBuE-Exoz2M4txcKC7w24bfm8qwzGxzEJ5LdfXyPW7j-QHGmZamqA6VqarXvfb8oGU"
              />
            </div>
          </div>
        </section>

        <section id="about" className="max-w-6xl mx-auto px-6 mb-24 relative z-10 reveal-animation">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-8 md:p-12 border border-[#dbc2b0] editorial-shadow grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest block mb-3">Who We Are</span>
              <h2 className="text-3xl font-extrabold text-[#1a1c1c] mb-6 leading-tight">
                Pioneering the future of document intelligence at DOCU.
              </h2>
              <p className="text-[#554336] leading-relaxed text-sm mb-4">
                At DOCU, we believe that research shouldn't be bottlenecked by manual reading and search friction. Our team builds context-aware artificial intelligence platforms that help professionals synthesize mountains of textual data with absolute precision.
              </p>
              <p className="text-[#554336] leading-relaxed text-sm">
                Whether you are analyzing academic journals, financial reports, complex legal agreements, or raw scanned documentation, our custom chunking algorithms and vector matching engines are designed to surface grounded truth, with zero hallucinations.
              </p>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-[#dbc2b0] aspect-square flex items-center justify-center bg-white shadow-sm">
              <img 
                alt="Modern research workspace illustration" 
                className="w-full h-full object-cover animate-fade-in" 
                src="/about_showcase.png"
              />
            </div>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="15">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Instant Indexing" 
                    className="w-full h-full object-contain" 
                    src="/instant_indexing.jpg"
                  />
                </div>
                <h3 className="font-extrabold text-lg text-[#1a1c1c] mb-3">Instant Indexing</h3>
                <p className="text-xs text-[#554336] leading-relaxed">
                  Upload thousands of pages. Our engine categorizes and semanticizes your entire library in seconds, not minutes.
                </p>
              </div>
            </div>

            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="20">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Contextual Citations" 
                    className="w-full h-full object-contain" 
                    src="/contextual_citations.jpg"
                  />
                </div>
                <h3 className="font-extrabold text-lg text-[#1a1c1c] mb-3">Contextual Citations</h3>
                <p className="text-xs text-[#554336] leading-relaxed">
                  Never lose track of the source. Every AI response includes direct, clickable links to the exact paragraph in your PDFs.
                </p>
              </div>
            </div>

            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="25">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Deep Analysis" 
                    className="w-full h-full object-contain" 
                    src="/deep_analysis.jpg"
                  />
                </div>
                <h3 className="font-extrabold text-lg text-[#1a1c1c] mb-3">Deep Analysis</h3>
                <p className="text-xs text-[#554336] leading-relaxed">
                  Synthesize complex themes across multiple documents. Generate executive summaries and comparative reports automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="max-w-6xl mx-auto px-6 mb-24 reveal-animation">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest block mb-3">Beta Access</span>
            <h2 className="text-3xl font-extrabold text-slate-800">Start researching today</h2>
          </div>
          <div className="bg-[#fffdfb] p-10 rounded-2xl border border-[#D97706]/40 relative editorial-shadow max-w-2xl mx-auto text-center">
            <div className="absolute top-4 right-4 bg-[#D97706] text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
              Limited Offer
            </div>
            
            <h3 className="font-extrabold text-2xl text-slate-800 mb-2">Join Private Beta</h3>
            <p className="text-xs text-[#554336] max-w-md mx-auto mb-6">
              Get full access to all features—including OCR parsing, vector-search query engine, and citation links.
            </p>
            
            <div className="inline-block bg-[#FEF3C7] border border-[#F59E0B]/30 px-6 py-2.5 rounded-full text-[#B45309] font-extrabold text-xs mb-8">
              🎉 Highlight: Free for 120 days
            </div>

            <button onClick={() => openAuth('register')} className="w-full py-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors max-w-sm mx-auto block">
              Join Beta Now
            </button>
          </div>
        </section>

      </main>

      <footer className="bg-white border-t border-[#dbc2b0]/30 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-bold text-[#8d4b00]">
              <div className="w-8 h-8 bg-[#D97706] rounded flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[20px]">description</span>
              </div>
              <span className="tracking-tighter font-extrabold text-lg uppercase">DOCU</span>
            </div>
            <p className="text-xs text-[#545f73] leading-relaxed">
              Synthesizing unstructured raw data into verifiable knowledge. Grounded intelligence platforms.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 mb-4 uppercase tracking-wider">Product</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#545f73]">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing Plans</a>
              <span className="cursor-pointer" onClick={() => openAuth('login')}>API Access</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 mb-4 uppercase tracking-wider">Company</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#545f73]">
              <a href="#about">About us</a>
              <span>Research Hub</span>
              <span>Join team</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs text-[#545f73] leading-relaxed">Weekly briefs in document analytics and AI.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="name@domain.com" className="w-full bg-[#f9f9f9] border border-[#dbc2b0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none" />
              <button onClick={() => openAuth('register')} className="bg-[#D97706] text-white p-2 rounded-lg hover:opacity-95 transition-opacity">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-[#dbc2b0]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#545f73]">
          <span>© 2026 DOCU Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span>Powered by MongoDB Atlas & Gemini</span>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-sm">language</span>
              <span className="material-symbols-outlined text-sm">public</span>
            </div>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#dbc2b0] rounded-2xl w-full max-w-md p-8 editorial-shadow relative">
            
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6 justify-center">
              <div className="w-7 h-7 bg-[#D97706] rounded flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[18px]">description</span>
              </div>
              <span className="font-extrabold text-lg uppercase tracking-tight text-slate-800">DOCU</span>
            </div>

            <div className="flex border-b border-[#dbc2b0]/50 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); setShowPassword(false); }}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${
                  authMode === 'login' 
                    ? 'border-b-2 border-[#D97706] text-[#8d4b00]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(null); setShowPassword(false); }}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${
                  authMode === 'register' 
                    ? 'border-b-2 border-[#D97706] text-[#8d4b00]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#f9f9f9] border border-[#dbc2b0] rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f9f9f9] border border-[#dbc2b0] rounded-xl pl-4 pr-10 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-semibold select-none">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-[#D97706] text-white rounded-xl text-sm font-bold shadow-md shadow-amber-700/10 hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Register Account'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
