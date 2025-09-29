import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Interactive3D from "./Interactive3D";

const Landing = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "Interactive Ocean Maps",
      description: "Explore real-time ARGO float data with interactive visualizations",
      icon: "🗺️",
      color: "from-slate-600 to-slate-500",
      route: "/map"
    },
    {
      title: "Data Analytics Dashboard",
      description: "Comprehensive insights into temperature, salinity, and ocean currents",
      icon: "📊",
      color: "from-slate-600 to-slate-500",
      route: "/dashboard"
    },
    {
      title: "Upload & Analyze",
      description: "Process your NetCDF files with scientific-grade visualizations",
      icon: "📈",
      color: "from-slate-600 to-slate-500",
      route: "/upload"
    }
  ];

  const stats = [
    { number: "4000+", label: "ARGO Floats", icon: "🌊" },
    { number: "24/7", label: "Real-time Data", icon: "⚡" },
    { number: "Global", label: "Ocean Coverage", icon: "🌍" },
    { number: "Open", label: "Source Platform", icon: "🔓" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-slate-300/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🌊</span>
            </div>
            <h1 className="text-2xl font-bold text-white">ARGO Float Dashboard</h1>
          </div>
           
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left lg:text-center">
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 shadow-lg mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
              <span>Trusted by ocean researchers worldwide</span>
            </div>
            
            <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-tight mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 bg-clip-text text-transparent">
                Ocean Data
              </span>
              <br />
              <span className="text-white/90">Visualized</span>
            </h1>
            
            <p className={`text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Explore the depths of our oceans with interactive ARGO float data. 
              Visualize temperature profiles, salinity patterns, and ocean currents 
              with scientific precision and beautiful design.
            </p>
            
            <div className={`flex flex-wrap justify-center gap-6 mb-16 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Link
                to="/map"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-2xl hover:from-slate-600 hover:to-slate-500 text-lg font-semibold shadow-2xl hover:shadow-slate-500/25 transition-all duration-300 hover:scale-105"
              >
                <span>🗺️</span>
                <span>Explore Map</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link
                to="/upload"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl border border-white/20 hover:bg-white/20 text-lg font-semibold shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105"
              >
                <span>📊</span>
                <span>Upload Data</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </Link>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-black text-slate-200 mb-1">{stat.number}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
            </div>
            
            {/* 3D Interactive Ocean Visualization */}
            <div className={`relative transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="h-[500px] lg:h-[600px]">
                <Interactive3D className="w-full h-full" />
              </div>
              
              {/* Decorative elements around the 3D canvas */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-slate-400/10 to-slate-500/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-slate-300/10 to-slate-400/10 rounded-full blur-xl"></div>
              
              {/* Floating data indicators */}
              <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-white/90 text-sm font-medium mb-1">ARGO Floats</div>
                <div className="text-2xl font-bold text-slate-300">4,000+</div>
                <div className="text-white/60 text-xs">Active worldwide</div>
              </div>
              
               
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-slate-800/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Powerful Ocean Data Tools
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Everything you need to explore, analyze, and visualize oceanographic data
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Feature Cards */}
            <div className="grid md:grid-cols-1 gap-6">
              {features.map((feature, index) => (
                <Link
                  key={index}
                  to={feature.route}
                  className={`group bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/20 ${
                    currentFeature === index ? 'ring-2 ring-slate-400/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-slate-300 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                    <span className="text-sm font-medium">Explore</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mini 3D Visualization */}
            <div className="relative">
              <div className="h-[400px] rounded-2xl overflow-hidden border border-white/20">
                <Interactive3D className="w-full h-full" />
              </div>
              
              {/* Interactive overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Feature highlight */}
              <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-white/90 text-sm font-medium mb-1">Current Feature</div>
                <div className="text-lg font-bold text-slate-300">{features[currentFeature].title}</div>
                <div className="text-white/60 text-xs">Click to explore</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Dive In?
          </h2>
          <p className="text-xl text-white/80 mb-12">
            Start exploring ocean data today with our powerful visualization tools
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-2xl hover:from-slate-600 hover:to-slate-500 text-lg font-semibold shadow-2xl hover:shadow-slate-500/25 transition-all duration-300 hover:scale-105"
            >
              <span>🚀</span>
              <span>Start Exploring</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link
              to="/chat"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl border border-white/20 hover:bg-white/20 text-lg font-semibold shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105"
            >
              <span>🤖</span>
              <span>AI Assistant</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🌊</span>
                </div>
                <h3 className="text-xl font-bold text-white">ARGO Float Dashboard</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Advanced oceanographic data visualization platform for researchers, 
                scientists, and ocean enthusiasts worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-white/60">
                <li>Interactive Maps</li>
                <li>Data Analytics</li>
                <li>NetCDF Processing</li>
                <li>Real-time Updates</li>
                <li>AI Chat Assistant</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Technology</h4>
              <ul className="space-y-2 text-white/60">
                <li>React & JavaScript</li>
                <li>Node.js & Python</li>
                <li>Leaflet Maps</li>
                <li>Scientific Computing</li>
                <li>Machine Learning</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>© {new Date().getFullYear()} ARGO Float Dashboard. Built for ocean science and research.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
