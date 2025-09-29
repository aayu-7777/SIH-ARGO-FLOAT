import React, { useEffect, useRef, useState } from "react";

const Interactive3D = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({
    // 3D Ocean elements
    oceanParticles: [],
    floatingOrbs: [],
    wavePoints: [],
    depthLayers: [],
    // Interaction state
    mouseX: 0,
    mouseY: 0,
    isInteracting: false,
    rotationX: 0,
    rotationY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    // Animation state
    time: 0,
    wavePhase: 0,
    currentPhase: 0,
    // 3D ARGO float representation
    argoFloats: [],
    oceanCurrents: [],
    // Lighting and atmosphere
    lightSource: { x: 0, y: 0, z: 2 },
    atmosphere: [],
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    
    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * DPR);
      canvas.height = Math.floor(clientHeight * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    
    resize();
    window.addEventListener("resize", resize);

    // Initialize data points for ocean visualization
    const initDataPoints = () => {
      const points = [];
      for (let i = 0; i < 60; i++) {
        // Create scientific data point distribution
        const radius = 0.9 + Math.random() * 1.1;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 1.8;
        
        points.push({
          x: Math.cos(angle) * radius,
          y: height,
          z: Math.sin(angle) * radius,
          originalX: Math.cos(angle) * radius,
          originalY: height,
          originalZ: Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.0005,
          vy: (Math.random() - 0.5) * 0.0005,
          vz: (Math.random() - 0.5) * 0.0005,
          size: 1.2 + Math.random() * 1.8,
          alpha: 0.4 + Math.random() * 0.3,
          type: 'data',
          phase: Math.random() * Math.PI * 2,
          speed: 0.0003 + Math.random() * 0.001,
          // Scientific properties
          temperature: Math.random(),
          salinity: Math.random(),
          depth: Math.abs(height),
          latitude: height,
          longitude: angle,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.001 + Math.random() * 0.002,
        });
      }
      return points;
    };

    // Initialize oceanographic sensors
    const initSensors = () => {
      const sensors = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1.6 + Math.random() * 0.6;
        sensors.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.4,
          z: Math.sin(angle) * radius * 0.3,
          originalX: Math.cos(angle) * radius,
          originalY: Math.sin(angle) * radius * 0.4,
          originalZ: Math.sin(angle) * radius * 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.001,
          size: 1.5 + Math.random() * 1,
          type: 'sensor',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.001 + Math.random() * 0.002,
        });
      }
      return sensors;
    };

    // Initialize ocean surface grid
    const initSurfaceGrid = () => {
      const points = [];
      for (let i = 0; i < 30; i++) {
        for (let j = 0; j < 15; j++) {
          points.push({
            x: (i / 30) * 3.6 - 1.8,
            y: (j / 15) * 1.8 - 0.9,
            z: 0,
            originalY: (j / 15) * 1.8 - 0.9,
            phase: Math.random() * Math.PI * 2,
            speed: 0.002 + Math.random() * 0.003,
            amplitude: 0.05 + Math.random() * 0.15,
          });
        }
      }
      return points;
    };

    // Initialize ARGO floats
    const initArgoFloats = () => {
      const floats = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 1.7 + Math.random() * 0.3;
        floats.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.2,
          z: Math.sin(angle) * radius * 0.4,
          originalX: Math.cos(angle) * radius,
          originalY: Math.sin(angle) * radius * 0.2,
          originalZ: Math.sin(angle) * radius * 0.4,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0003 + Math.random() * 0.0008,
          size: 1.8 + Math.random() * 0.8,
          depth: Math.random() * 0.6 + 0.3,
          dataTransmission: Math.random() * Math.PI * 2,
          transmissionSpeed: 0.008 + Math.random() * 0.015,
        });
      }
      return floats;
    };

    // Initialize ocean currents
    const initOceanCurrents = () => {
      const currents = [];
      for (let i = 0; i < 4; i++) {
        currents.push({
          x: (Math.random() - 0.5) * 3.5,
          y: (Math.random() - 0.5) * 3.5,
          z: (Math.random() - 0.5) * 3.5,
          vx: (Math.random() - 0.5) * 0.0008,
          vy: (Math.random() - 0.5) * 0.0008,
          vz: (Math.random() - 0.5) * 0.0008,
          size: 0.2 + Math.random() * 0.5,
          alpha: 0.15 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0015 + Math.random() * 0.003,
        });
      }
      return currents;
    };

    // Initialize atmosphere layers
    const initAtmosphere = () => {
      const layers = [];
      for (let i = 0; i < 2; i++) {
        layers.push({
          radius: 1.1 + i * 0.15,
          alpha: 0.08 - i * 0.03,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0002 + i * 0.0001,
        });
      }
      return layers;
    };

    // Initialize all 3D elements
    stateRef.current.oceanParticles = initDataPoints();
    stateRef.current.floatingOrbs = initSensors();
    stateRef.current.wavePoints = initSurfaceGrid();
    stateRef.current.argoFloats = initArgoFloats();
    stateRef.current.oceanCurrents = initOceanCurrents();
    stateRef.current.atmosphere = initAtmosphere();

    // Interaction handlers
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const my = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
      const nx = (mx / rect.width) * 2 - 1;
      const ny = (my / rect.height) * 2 - 1;
      
      stateRef.current.mouseX = nx;
      stateRef.current.mouseY = ny;
      stateRef.current.isInteracting = true;
      
      // Smooth rotation based on mouse position
      stateRef.current.targetRotationY = nx * 0.3;
      stateRef.current.targetRotationX = -ny * 0.3;
    };

    const onLeave = () => {
      stateRef.current.isInteracting = false;
      setIsHovered(false);
    };

    const onEnter = () => {
      setIsHovered(true);
    };

    const onClick = (e) => {
      // Add ripple effect on click
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      // Create temporary ripple effect
      stateRef.current.rippleEffect = {
        x: mx,
        y: my,
        time: 0,
        maxTime: 60,
      };
      
      // Make nearby data points react to click
      const clickX = (mx / rect.width) * 2 - 1;
      const clickY = (my / rect.height) * 2 - 1;
      
      stateRef.current.oceanParticles.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - clickX, 2) + 
          Math.pow(point.y - clickY, 2) + 
          Math.pow(point.z, 2)
        );
        
        if (distance < 0.4) {
          // Update data point properties
          point.pulsePhase = Math.PI * 2; // Reset pulse
          point.temperature = Math.random(); // Update temperature reading
          point.salinity = Math.random(); // Update salinity reading
        }
      });
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("click", onClick);

    // 3D projection functions
    const project = (p, w, h) => {
      const fov = 300;
      const scale = fov / (fov + p.z * 100);
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) * 0.4;
      return {
        x: p.x * radius * scale + centerX,
        y: p.y * radius * scale + centerY,
        s: scale,
        z: p.z,
      };
    };

    const rotate = (p, ax, ay) => {
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      let y = p.y * cosX - p.z * sinX;
      let z = p.y * sinX + p.z * cosX;
      let x = p.x * cosY + z * sinY;
      z = -p.x * sinY + z * cosY;
      return { x, y, z };
    };

    // Color functions
    const getDataPointColor = (point, alpha = 1) => {
      // Scientific color mapping based on temperature
      const temp = point.temperature;
      const intensity = 0.3 + temp * 0.7;
      
      if (temp < 0.3) {
        // Cold water - deep blue
        return `rgba(${30 * intensity}, ${60 * intensity}, ${120 * intensity}, ${alpha})`;
      } else if (temp < 0.7) {
        // Moderate temperature - blue-green
        return `rgba(${40 * intensity}, ${100 * intensity}, ${140 * intensity}, ${alpha})`;
      } else {
        // Warm water - lighter blue
        return `rgba(${60 * intensity}, ${120 * intensity}, ${160 * intensity}, ${alpha})`;
      }
    };

    const getOceanColor = (depth, alpha = 1, type = 'default') => {
      const colors = {
        sensor: `rgba(148, 163, 184, ${alpha})`,
        data: `rgba(148, 163, 184, ${alpha})`,
        default: `rgba(${100 + depth * 50}, ${120 + depth * 40}, ${140 + depth * 30}, ${alpha})`,
      };
      return colors[type] || colors.default;
    };

    const getArgoFloatColor = (depth, alpha = 1) => {
      const intensity = 0.6 + depth * 0.4;
      return `rgba(${100 * intensity}, ${120 * intensity}, ${140 * intensity}, ${alpha})`;
    };

    // Main render function
    const render = (t = 0) => {
      const { width, height } = canvas;
      const s = stateRef.current;
      
      // Update time and phases
      s.time = t;
      s.wavePhase += 0.01;
      s.currentPhase += 0.005;
      
      // Smooth rotation
      s.rotationX += (s.targetRotationX - s.rotationX) * 0.05;
      s.rotationY += (s.targetRotationY - s.rotationY) * 0.05;
      
      // Add subtle auto-rotation
      if (!s.isInteracting) {
        s.targetRotationY += 0.0003;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const sphereRadius = Math.min(width, height) * 0.4;

      ctx.clearRect(0, 0, width, height);

      // Ocean depth background
      ctx.save();
      const oceanGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height)/2);
      oceanGradient.addColorStop(0, "rgba(71, 85, 105, 0.3)");
      oceanGradient.addColorStop(0.3, "rgba(51, 65, 85, 0.4)");
      oceanGradient.addColorStop(0.7, "rgba(30, 41, 59, 0.5)");
      oceanGradient.addColorStop(1, "rgba(15, 23, 42, 0.7)");
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Render atmosphere layers
      ctx.save();
      for (let i = 0; i < s.atmosphere.length; i++) {
        const layer = s.atmosphere[i];
        layer.phase += layer.speed;
        
        ctx.globalAlpha = layer.alpha;
        ctx.strokeStyle = `rgba(148, 163, 184, ${layer.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const radius = sphereRadius * layer.radius;
        const waveOffset = Math.sin(layer.phase) * 3;
        ctx.arc(centerX, centerY + waveOffset, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Render ocean currents
      ctx.save();
      for (let i = 0; i < s.oceanCurrents.length; i++) {
        const current = s.oceanCurrents[i];
        current.phase += current.speed;
        
        // Update position with current flow
        current.x += current.vx + Math.sin(current.phase) * 0.0005;
        current.y += current.vy + Math.cos(current.phase * 0.7) * 0.0003;
        current.z += current.vz + Math.sin(current.phase * 1.3) * 0.0004;
        
        // Reset if out of bounds
        if (Math.abs(current.x) > 2.5) current.x = (Math.random() - 0.5) * 4;
        if (Math.abs(current.y) > 2.5) current.y = (Math.random() - 0.5) * 4;
        if (Math.abs(current.z) > 2.5) current.z = (Math.random() - 0.5) * 4;
        
        const rp = rotate(current, s.rotationX, s.rotationY);
        const pr = project(rp, width, height);
        
        if (pr.z > -0.8) {
          const depth = (rp.z + 1) / 2;
          const alpha = Math.max(0.2, current.alpha * depth);
          const size = Math.max(1, current.size * pr.s * sphereRadius * 0.08);
          
          ctx.globalAlpha = alpha;
          ctx.shadowColor = 'rgba(148, 163, 184, 0.3)';
          ctx.shadowBlur = 15;
          ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Render wave points (ocean surface)
      ctx.save();
      for (let i = 0; i < s.wavePoints.length; i++) {
        const point = s.wavePoints[i];
        point.phase += point.speed;
        
        // Create wave motion
        const waveOffset = Math.sin(point.phase + point.x * 2) * point.amplitude;
        point.y = point.originalY + waveOffset;
        
        const rp = rotate(point, s.rotationX, s.rotationY);
        const pr = project(rp, width, height);
        
        if (pr.z > -0.5) {
          const depth = (rp.z + 1) / 2;
          const alpha = Math.max(0.3, Math.min(0.8, depth));
          const size = Math.max(0.5, 1.5 * pr.s);
          
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgba(${100 + depth * 50}, ${120 + depth * 40}, ${140 + depth * 30}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Render ARGO floats
      ctx.save();
      for (let i = 0; i < s.argoFloats.length; i++) {
        const float = s.argoFloats[i];
        float.phase += float.speed;
        float.dataTransmission += float.transmissionSpeed;
        
        // Animate float movement
        float.x = float.originalX + Math.sin(float.phase) * 0.2;
        float.y = float.originalY + Math.cos(float.phase * 0.7) * 0.1;
        float.z = float.originalZ + Math.sin(float.phase * 1.3) * 0.15;
        
        const rp = rotate(float, s.rotationX, s.rotationY);
        const pr = project(rp, width, height);
        
        if (pr.z > -0.8) {
          const depth = (rp.z + 1) / 2;
          const alpha = Math.max(0.6, Math.min(1, depth));
          const size = Math.max(3, float.size * pr.s * sphereRadius * 0.1);
          
          // Main float body
          ctx.globalAlpha = alpha;
          ctx.shadowColor = getArgoFloatColor(depth, 1);
          ctx.shadowBlur = 20 + depth * 10;
          ctx.fillStyle = getArgoFloatColor(depth, 1);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Data transmission lines
          if (Math.sin(float.dataTransmission) > 0.7) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.8})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pr.x, pr.y);
            ctx.lineTo(pr.x + Math.sin(float.dataTransmission) * 20, pr.y + Math.cos(float.dataTransmission) * 15);
            ctx.stroke();
          }
          
          // Float label
          ctx.shadowBlur = 0;
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('ARGO', pr.x, pr.y + 3);
        }
      }
      ctx.restore();

      // Render oceanographic sensors
      ctx.save();
      for (let i = 0; i < s.floatingOrbs.length; i++) {
        const sensor = s.floatingOrbs[i];
        sensor.phase += sensor.speed;
        sensor.pulsePhase += sensor.pulseSpeed;
        
        // Subtle sensor movement
        sensor.x = sensor.originalX + Math.sin(sensor.phase) * 0.15;
        sensor.y = sensor.originalY + Math.cos(sensor.phase * 0.7) * 0.1;
        sensor.z = sensor.originalZ + Math.sin(sensor.phase * 1.3) * 0.12;
        
        const rp = rotate(sensor, s.rotationX, s.rotationY);
        const pr = project(rp, width, height);
        
        if (pr.z > -0.6) {
          const depth = (rp.z + 1) / 2;
          const alpha = Math.max(0.3, Math.min(0.7, depth));
          const pulseSize = 1 + Math.sin(sensor.pulsePhase) * 0.15;
          const size = Math.max(1.5, sensor.size * pr.s * sphereRadius * 0.06 * pulseSize);
          
          ctx.globalAlpha = alpha;
          ctx.shadowColor = getOceanColor(depth, 1, sensor.type);
          ctx.shadowBlur = 8 + depth * 4;
          ctx.fillStyle = getOceanColor(depth, 1, sensor.type);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add subtle inner highlight
          ctx.shadowBlur = 0;
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
          ctx.beginPath();
          ctx.arc(pr.x - size * 0.3, pr.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Render data points
      ctx.save();
      for (let i = 0; i < s.oceanParticles.length; i++) {
        const point = s.oceanParticles[i];
        point.phase += point.speed;
        point.pulsePhase += point.pulseSpeed;
        
        // Subtle data point movement
        point.x = point.originalX + Math.sin(point.phase) * 0.05;
        point.y = point.originalY + Math.cos(point.phase * 0.7) * 0.03;
        point.z = point.originalZ + Math.sin(point.phase * 1.3) * 0.04;
        
        const rp = rotate(point, s.rotationX, s.rotationY);
        const pr = project(rp, width, height);
        
        if (pr.z > -0.8) {
          const depth = (rp.z + 1) / 2;
          const alpha = Math.max(0.3, point.alpha * depth);
          const pulseSize = 1 + Math.sin(point.pulsePhase) * 0.1;
          const size = Math.max(1.2, point.size * pr.s * sphereRadius * 0.05 * pulseSize);
          
          ctx.globalAlpha = alpha;
          
          // Get scientific color based on temperature
          const pointColor = getDataPointColor(point, alpha);
          ctx.shadowColor = pointColor;
          ctx.shadowBlur = 6 + depth * 4;
          ctx.fillStyle = pointColor;
          
          // Draw main data point
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add subtle highlight
          ctx.shadowBlur = 0;
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(pr.x - size * 0.4, pr.y - size * 0.4, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          
          // Add temperature indicator (subtle ring for high temps)
          if (point.temperature > 0.8) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = `rgba(255, 150, 150, ${alpha * 0.6})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, size * 1.3, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Render ripple effect on click
      if (s.rippleEffect && s.rippleEffect.time < s.rippleEffect.maxTime) {
        ctx.save();
        const ripple = s.rippleEffect;
        ripple.time++;
        
        const progress = ripple.time / ripple.maxTime;
        const radius = progress * 100;
        const alpha = (1 - progress) * 0.5;
        
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        if (ripple.time >= ripple.maxTime) {
          s.rippleEffect = null;
        }
      }

      // Add caustic light effects
      ctx.save();
      ctx.globalAlpha = 0.3;
      const lightGradient = ctx.createRadialGradient(
        centerX + s.mouseX * 40 + Math.sin(t * 0.0008) * 20, 
        centerY + s.mouseY * 40 + Math.cos(t * 0.0006) * 15, 
        0, 
        centerX + s.mouseX * 40 + Math.sin(t * 0.0008) * 20, 
        centerY + s.mouseY * 40 + Math.cos(t * 0.0006) * 15, 
        150
      );
      lightGradient.addColorStop(0, "rgba(203, 213, 225, 0.1)");
      lightGradient.addColorStop(0.5, "rgba(148, 163, 184, 0.05)");
      lightGradient.addColorStop(1, "rgba(100, 116, 139, 0.03)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${className} ${
      isHovered ? 'shadow-2xl shadow-slate-500/30' : 'shadow-lg shadow-slate-500/20'
    }`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-pointer" 
        style={{ background: 'transparent' }}
      />
      
      {/* Overlay UI elements */}
      <div className="absolute top-4 left-4 text-slate-300/80 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
        🌊 Ocean Data Visualization
      </div>
      <div className="absolute bottom-4 right-4 text-slate-400/70 text-xs bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
        Click data points to update readings
      </div>
      
      {/* Data transmission indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-slate-300/80 text-xs bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
        <span>Live Data</span>
      </div>
    </div>
  );
};

export default Interactive3D;
