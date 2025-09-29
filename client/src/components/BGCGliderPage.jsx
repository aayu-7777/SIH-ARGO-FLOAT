import React from "react";

const BGCGliderPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main Container */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Main Heading */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #94a3b8, #e2e8f0)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          🌊 BGC & Glider Data
        </h1>

        {/* Horizontal Divider */}
        <div style={{
          width: '100px',
          height: '3px',
          background: 'linear-gradient(90deg, #94a3b8, #e2e8f0)',
          margin: '0 auto 2rem auto',
          borderRadius: '2px'
        }}></div>

        {/* Development Message */}
        <p style={{
          fontSize: '1.2rem',
          color: '#cbd5e1',
          marginBottom: '2.5rem',
          lineHeight: '1.6',
          fontWeight: '300'
        }}>
          This page is currently under development. We're working hard to bring you 
          comprehensive Bio-Geo-Chemical and Glider data visualization tools.
        </p>

        {/* Upcoming Features List */}
        <div style={{
          textAlign: 'left',
          marginBottom: '2.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#e2e8f0',
            textAlign: 'center'
          }}>
            🚀 Upcoming Features
          </h3>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              color: '#cbd5e1'
            }}>
              <span style={{
                marginRight: '0.75rem',
                fontSize: '1.2rem'
              }}>🌿</span>
              Chlorophyll, oxygen, and nitrate profiles
            </li>
            
            <li style={{
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              color: '#cbd5e1'
            }}>
              <span style={{
                marginRight: '0.75rem',
                fontSize: '1.2rem'
              }}>🛰️</span>
              Glider trajectories and comparison with Argo data
            </li>
            
            <li style={{
              padding: '0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              color: '#cbd5e1'
            }}>
              <span style={{
                marginRight: '0.75rem',
                fontSize: '1.2rem'
              }}>🗺️</span>
              Region-specific BGC visualizations
            </li>
          </ul>
        </div>

        {/* Coming Soon Message */}
        <div style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          fontWeight: '500',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          opacity: '0.8'
        }}>
          🔧 Coming Soon!
        </div>

        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(148, 163, 184, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '60px',
          height: '60px',
          background: 'radial-gradient(circle, rgba(226, 232, 240, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default BGCGliderPage;
