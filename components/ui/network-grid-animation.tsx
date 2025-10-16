import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export default function NetworkGridAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles
  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const particles = [];
    // Responsive particle count based on screen size
    const isMobile = canvas.width < 768; // Mobile breakpoint
    const isTablet = canvas.width < 1024 && canvas.width >= 768; // Tablet breakpoint
    
    let particleCount;
    if (isMobile) {
      particleCount = 60; // Reduced for mobile
    } else if (isTablet) {
      particleCount = 100; // Medium for tablet
    } else {
      particleCount = 150; // Full for desktop
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    
    particlesRef.current = particles;
  }, []);

  // Draw particle
  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle, time: number) => {
    const pulse = Math.sin(time * particle.pulseSpeed + particle.pulseOffset) * 0.3 + 0.7;
    const glowSize = particle.size * pulse * 3;
    
    // Outer glow
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, glowSize
    );
    gradient.addColorStop(0, `rgba(255, 107, 53, ${particle.opacity * pulse * 0.8})`);
    gradient.addColorStop(0.4, `rgba(255, 140, 66, ${particle.opacity * pulse * 0.4})`);
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Core particle
    ctx.fillStyle = `rgba(255, 107, 53, ${particle.opacity * pulse})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * pulse, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Draw connection line
  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, p1: Particle, p2: Particle, distance: number, maxDistance: number, time: number) => {
    const opacity = (1 - distance / maxDistance) * 0.5;
    const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
    
    // Calculate mouse influence
    const mouseDistance = Math.sqrt(
      Math.pow(mouseRef.current.x - (p1.x + p2.x) / 2, 2) +
      Math.pow(mouseRef.current.y - (p1.y + p2.y) / 2, 2)
    );
    const mouseInfluence = Math.max(0, 1 - mouseDistance / 200) * 2;
    
    const finalOpacity = opacity * pulse * (1 + mouseInfluence);
    
    // Glow line
    ctx.strokeStyle = `rgba(255, 140, 66, ${finalOpacity * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    // Core line
    ctx.strokeStyle = `rgba(255, 107, 53, ${finalOpacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }, []);

  // Animation loop
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const particles = particlesRef.current;
    
    // Clear canvas with black background
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      }
    });
    
    // Draw connections between particles
    const maxDistance = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const distance = Math.sqrt(
          Math.pow(particles[i].x - particles[j].x, 2) +
          Math.pow(particles[i].y - particles[j].y, 2)
        );
        
        if (distance < maxDistance) {
          drawConnection(ctx, particles[i], particles[j], distance, maxDistance, time);
        }
      }
    }
    
    // Draw connections from mouse to nearby particles
    const mouseConnectionDistance = 150;
    particles.forEach(particle => {
      const mouseDistance = Math.sqrt(
        Math.pow(mouseRef.current.x - particle.x, 2) +
        Math.pow(mouseRef.current.y - particle.y, 2)
      );
      
      if (mouseDistance < mouseConnectionDistance) {
        // Draw enhanced connection to mouse
        const opacity = (1 - mouseDistance / mouseConnectionDistance) * 0.8;
        const pulse = Math.sin(time * 0.005) * 0.4 + 0.6;
        
        // Bright glow line to mouse
        ctx.strokeStyle = `rgba(255, 165, 0, ${opacity * pulse * 0.8})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
        ctx.stroke();
        
        // Core line to mouse
        ctx.strokeStyle = `rgba(255, 107, 53, ${opacity * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
        ctx.stroke();
        
        // Add sparkling effect at connection points
        const sparkle = Math.sin(time * 0.01 + particle.x * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 165, 0, ${sparkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2 + sparkle * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw particles
    particles.forEach(particle => {
      drawParticle(ctx, particle, time);
    });
    
    // Draw enhanced mouse cursor as a network node
    const mousePulse = Math.sin(time * 0.008) * 0.3 + 0.7;
    
    // Mouse node outer glow
    const mouseGradient = ctx.createRadialGradient(
      mouseRef.current.x, mouseRef.current.y, 0,
      mouseRef.current.x, mouseRef.current.y, 80 * mousePulse
    );
    mouseGradient.addColorStop(0, `rgba(255, 165, 0, ${0.3 * mousePulse})`);
    mouseGradient.addColorStop(0.3, `rgba(255, 140, 66, ${0.15 * mousePulse})`);
    mouseGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
    
    ctx.fillStyle = mouseGradient;
    ctx.beginPath();
    ctx.arc(mouseRef.current.x, mouseRef.current.y, 80 * mousePulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouse node core
    ctx.fillStyle = `rgba(255, 165, 0, ${0.8 * mousePulse})`;
    ctx.beginPath();
    ctx.arc(mouseRef.current.x, mouseRef.current.y, 6 * mousePulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouse node ring
    ctx.strokeStyle = `rgba(255, 107, 53, ${0.6 * mousePulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseRef.current.x, mouseRef.current.y, 12 * mousePulse, 0, Math.PI * 2);
    ctx.stroke();
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawParticle, drawConnection]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reinitialize particles for new canvas size
    initParticles(canvas);
  }, [initParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Initialize particles
    initParticles(canvas);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [animate, handleResize, handleMouseMove, initParticles]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'black' }}
      />
    </div>
  );
} 