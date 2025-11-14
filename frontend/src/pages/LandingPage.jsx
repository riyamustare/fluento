import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="text-2xl font-bold text-black">fluento</div>
          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              className="px-5 py-2 text-gray-700 hover:text-black transition-colors font-semibold"
            >
              log in
            </button>
            <button
              onClick={handleGetStarted}
              className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105"
            >
              sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden bg-linear-to-r from-gray-50 via-white to-gray-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 py-20">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-8 leading-tight tracking-tight">
            speak english
            <br />
            <span className="bg-linear-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              with confidence
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
            the secret to fluency? <span className="font-bold text-gray-800">consistent practice.</span> speak more, improve faster.
            <span className="block mt-2 text-gray-500">get instant AI feedback on pronunciation, grammar, and fluency.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="group px-10 py-5 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3"
            >
              <span>start practicing free</span>
            </button>
            <button
              onClick={() => document.getElementById('introducing-fluento').scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 bg-white text-black font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
            >
              see how it works
            </button>
          </div>

          
        </div>
      </section>


      {/* Problem Section - Animated Cards */}
      <section className="py-24 px-6 bg-linear-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-bold text-5xl md:text-6xl tracking-tight mb-6 bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              learning a language is hard
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 font-medium">
              80% of language learners give up within the first 3 months...
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
            <div className="flex-1 w-full bg-white rounded-3xl p-10 text-left shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="flex flex-row md:flex-col items-center md:items-start gap-6">
                <span className="text-6xl md:text-7xl">🎯</span>
                <div>
                  <div className="text-2xl font-bold mb-4">set a goal</div>
                  <div className="text-gray-600 space-y-2 text-sm">
                    <div>"I want to speak English fluently"</div>
                    <div>"I need to pass my exam"</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <svg className="w-6 h-6 text-gray-300 rotate-90 md:rotate-0" fill="currentColor" viewBox="0 0 448 512">
                <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z"/>
              </svg>
            </div>

            <div className="flex-1 w-full bg-white rounded-3xl p-10 text-left shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="flex flex-row md:flex-col items-center md:items-start gap-6">
                <span className="text-6xl md:text-7xl">📚</span>
                <div>
                  <div className="text-2xl font-bold mb-4">try your best</div>
                  <div className="text-gray-600 space-y-2 text-sm">
                    <div>Use language apps</div>
                    <div>Watch YouTube tutorials</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <svg className="w-6 h-6 text-gray-300 rotate-90 md:rotate-0" fill="currentColor" viewBox="0 0 448 512">
                <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z"/>
              </svg>
            </div>

            <div className="flex-1 w-full bg-white rounded-3xl p-10 text-left shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="flex flex-row md:flex-col items-center md:items-start gap-6">
                <span className="text-6xl md:text-7xl">😔</span>
                <div>
                  <div className="text-2xl font-bold mb-4">but nothing changes...</div>
                  <div className="text-gray-600 space-y-2 text-sm">
                    <div>"I'm too shy to speak"</div>
                    <div>"No one to practice with"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              sound familiar?
            </p>
            <p className="text-xl text-gray-600">
              there's a better way ↓
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section - Enhanced */}
      <section id="introducing-fluento" className="py-24 px-6 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-black mb-6">
              introducing fluento
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              your AI-powered speaking coach that's available 24/7, never judges, and helps you improve with every practice session
            </p>
            <div className="inline-block px-6 py-3 bg-linear-to-r from-blue-50 to-purple-50 rounded-full border border-gray-200">
              <p className="text-lg font-semibold text-gray-800">
                the more you practice producing language, the more fluent you become
              </p>
            </div>
          </div>

          {/* Main feature showcase */}
          <div className="mb-16 bg-linear-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white shadow-2xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-3xl text-white font-bold mb-4" style={{ color: '#ffffff' }}>practice makes perfect</h3>
                <p className="text-xl text-white leading-relaxed mb-6">
                  research shows that active production is the fastest way to achieve fluency. fluento gives you unlimited opportunities to speak, make mistakes, and improve—without the pressure.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-1">✓</span>
                    <span className="text-gray-200">speak freely without fear of judgment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-1">✓</span>
                    <span className="text-gray-200">get instant, detailed feedback after each session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-1">✓</span>
                    <span className="text-gray-200">track improvement over time with XP & leagues</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h4 className="text-white text-2xl font-bold mb-2">your progress journey</h4>
                  <p className="text-white">from bronze to ace</p>
                </div>
                <div className="space-y-4">
                  {['Bronze', 'Silver', 'Gold', 'Diamond', 'Ace'].map((league, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-white">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-white">{league} League</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* CTA Section - White Background */}
      <section className="py-28 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-black">
            ready to improve your english?
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            join thousands of learners who are mastering english speaking with AI-powered feedback
          </p>
          <button
            onClick={handleGetStarted}
            className="group px-12 py-6 bg-black text-white font-bold text-xl rounded-xl hover:bg-gray-800 transition-all transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto"
          >
            <span>try fluento</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-white">fluento</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">privacy</a>
              <a href="#" className="hover:text-white transition-colors">terms</a>
              <a href="#" className="hover:text-white transition-colors">contact</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}