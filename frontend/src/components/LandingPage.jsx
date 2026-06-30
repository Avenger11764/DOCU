import React, { useEffect, useRef } from 'react';

export default function LandingPage({ onGetStarted }) {
  const canvasRef = useRef(null);
  


  useEffect(() => {
    // ----------------------------------------------------
    // Constellation Particle System Canvas Setup
    // ----------------------------------------------------
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

    // Initialize particles
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

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

        // Mouse interaction (pull particles slightly towards cursor)
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

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 83, 9, 0.7)'; // Darker, richer amber matching theme
        ctx.fill();

        // Connect to neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.35; // Higher contrast
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.55; // Higher contrast cursor connections
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

    // Cleanup events
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', init);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // ----------------------------------------------------
    // Parallax Interaction Setup
    // ----------------------------------------------------
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const handleParallax = (e) => {
      const { clientX, clientY } = e;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
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

    // Scroll reveal observer
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


  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans overflow-x-hidden selection:bg-[#ffb77d] relative min-h-screen">
      
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        .editorial-shadow-hover {
            box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        .parallax-target {
            transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1);
            will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
            .parallax-target {
                transition: none !important;
                transform: none !important;
            }
        }
        #hero-shader-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
            opacity: 0.65;
        }
        .button-premium {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .button-premium:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 10px 20px -5px rgba(141, 75, 0, 0.3);
        }
        .card-premium {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-premium:hover {
            transform: translateY(-4px);
        }
      `}} />

      {/* Global Constellation Particle System Backdrop */}
      <div id="hero-shader-container">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>

      {/* Navigation Shell */}
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
          <button onClick={onGetStarted} className="text-sm font-medium text-[#545f73] hover:text-[#8d4b00] transition-colors">Login</button>
          <button onClick={onGetStarted} className="bg-[#D97706] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity editorial-shadow">Get Started</button>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* Hero Section */}
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
              <button onClick={onGetStarted} className="button-premium bg-[#D97706] text-white px-8 py-3.5 rounded-xl font-bold text-lg editorial-shadow">
                Start Researching
              </button>
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section className="max-w-6xl mx-auto px-6 mb-20 relative">
          <div className="parallax-target relative rounded-xl overflow-hidden editorial-shadow bg-white border border-[#dbc2b0] p-2 md:p-4" data-parallax-strength="30">
            <div className="bg-[#eeeeee] rounded-lg aspect-video w-full overflow-hidden relative">
              <img 
                alt="Workspace with tablet showing DocuQuery interface" 
                className="w-full h-full object-cover cursor-pointer" 
                onClick={onGetStarted}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtlaMDAeCrTxOJ0Z3P6cbyeQ-UxxH4IdZ6p3NaS3e7ADb8AseX7nW4Qz2BApRTr4sxJMPi0-mgqhWE1_yVLNYrl0Xi_prRpwccwsydM_5y81yvGq0cbf-kZNpviAQ7wPbt5Vo6Xoysyfa5UJk5LGjF58CoHzvLpC8Srer0ZvF8CMcTxJWeVJzHSSMvnnwhFII49_TYGflLxhrBuE-Exoz2M4txcKC7w24bfm8qwzGxzEJ5LdfXyPW7j-QHGmZamqA6VqarXvfb8oGU"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
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

        {/* Features Grid */}
        <section id="features" className="max-w-6xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="15">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Instant Indexing" 
                    className="w-full h-full object-contain" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtKHIov7fwfDm1HN1zAJcIzcPHGPPNr-02xpKE7JWEsHfFcCqnBiGqrNHmMtdrBcjju8yUJTHZ_JdXOEeLNQsjiaJonqGadfrv-t3xhzH2C0K0dFnPB4u0_c49v1dl5tI9IdA7Ur9jzw81gznAnI3dS6Kv2McQNPP-BFr0SlzjcxXRfDOgl4eM6W5hMKiCsawQELUKMoKYesKsMT7XEMp9H0MEwW-VBcdrHHv114U5fjSqZAuWmcd7Ix42uCVFGt2ySDxBLjDh-3Z_"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Indexing</h3>
                <p className="text-[#554336] leading-relaxed text-sm">
                  Upload multiple pages. Our engine categorizes and processes your entire library in seconds, not minutes.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="20">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Contextual Citations" 
                    className="w-full h-full object-contain" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRndLotvx-yrKipgMaMMHd5jP2PY9oCN-r7PEvW3uRGcWE-oiH6Qx8uAJIYM2QlfmcTyFMglcrt-0vVSftqKbPFcpu8BBXL8HPR4x3msZconsYjrnxbgy9fIiE77Blq2MXCySilgLGZyQpieBnXjBvtnavLwv5TDL2qWLyicrCLzUj0HyjWPa3u49trecDlAGkZHAW1FfrcU60hvYakDIXwsIIs7oOsmybj3DLevaEMvffmkE-zZjXGegZhU5vKw3dwa3GLqKdxD5O"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Contextual Citations</h3>
                <p className="text-[#554336] leading-relaxed text-sm">
                  Never lose track of the source. Every AI response includes direct citations back to the source document chunks.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-premium reveal-animation parallax-target p-8 bg-white border border-[#dbc2b0] rounded-xl editorial-shadow hover:editorial-shadow-hover flex flex-col justify-between" data-parallax-strength="15">
              <div>
                <div className="w-full aspect-square bg-[#eeeeee] rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img 
                    alt="Deep Analysis" 
                    className="w-full h-full object-contain" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0fp6TArYe4m-bFTPadm1kW2oOjTjNGsviIcG8yJpyqnMVZYXIMJSK1LO5ceumUAzY3pm8NKBCuJUPbz6Q3dykYLI-fWzaJaJ3eeCsJnn4nGEoK-4njFDt-tbyYaTYO7hKKSc21Hxc9jCEGLQbL31PxublBAI9vMtuplZn9vlEyXnBnqPZQSYKPOseBnKY8gJuM4vifBpklXeqAzXCBO7reruBIjc9ERn_4qAoi6v1hm04wBTLtkNw7PXxRbmU1qM6sASeCkyvW-bo"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Deep Analysis</h3>
                <p className="text-[#554336] leading-relaxed text-sm">
                  Synthesize complex questions across multiple formats. Generate grounded answers and comparative reports automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y border-[#dbc2b0]/30 py-12 mb-20 bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs text-[#545f73] font-semibold uppercase tracking-widest mb-6">Trusted by elite research teams</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-65 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="h-8 w-32 bg-[#545f73]/10 rounded border border-[#dbc2b0]/30 flex items-center justify-center text-xs font-semibold text-[#545f73]">RESEARCH CORP</div>
              <div className="h-8 w-32 bg-[#545f73]/10 rounded border border-[#dbc2b0]/30 flex items-center justify-center text-xs font-semibold text-[#545f73]">ACADEMIA LABS</div>
              <div className="h-8 w-32 bg-[#545f73]/10 rounded border border-[#dbc2b0]/30 flex items-center justify-center text-xs font-semibold text-[#545f73]">ANALYTICA</div>
              <div className="h-8 w-32 bg-[#545f73]/10 rounded border border-[#dbc2b0]/30 flex items-center justify-center text-xs font-semibold text-[#545f73]">DATA LABS</div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-6 mb-20 relative z-10">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden p-12 md:p-16 editorial-shadow border border-[#dbc2b0] text-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D97706]"></div>
            <h2 className="text-3xl font-extrabold text-[#1a1c1c] mb-4">Your intelligence, amplified.</h2>
            <p className="text-base md:text-lg text-[#554336] max-w-xl mx-auto mb-8">
              Join over 2,500 researchers who have transformed their document workflow with DOCU.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button onClick={() => openAuth('register')} className="button-premium bg-[#D97706] text-white px-8 py-3.5 rounded-xl font-bold text-lg editorial-shadow">
                Join the Beta
              </button>
              <p className="text-sm text-[#545f73]">Free 14-day trial. No credit card required.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="pricing" className="bg-[#f3f3f3]/90 backdrop-blur-sm border-t border-[#dbc2b0]/50 pt-16 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#D97706]">description</span>
              <span className="font-bold text-xl tracking-tighter uppercase">DOCU</span>
            </div>
            <p className="text-[#554336] text-sm pr-4">
              The research workspace designed for clarity, speed, and precision.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 text-[#1a1c1c]">Product</h4>
            <ul className="space-y-2 text-xs text-[#554336]">
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">Features</a></li>
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">Workspace</a></li>
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 text-[#1a1c1c]">Company</h4>
            <ul className="space-y-2 text-xs text-[#554336]">
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">About</a></li>
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">Legal</a></li>
              <li><a onClick={() => openAuth('register')} className="hover:text-[#8d4b00] cursor-pointer">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 text-[#1a1c1c]">Subscribe</h4>
            <div className="flex gap-2">
              <input className="bg-white border border-[#dbc2b0] rounded-lg px-4 py-2 w-full text-xs focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="Email address" type="email"/>
              <button onClick={() => openAuth('register')} className="bg-[#D97706] text-white p-2 rounded-lg flex items-center justify-center">
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


    </div>
  );
}
