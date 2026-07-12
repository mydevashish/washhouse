'use client';

import { useEffect, useRef } from 'react';

import { resolveIdleAnimation } from '@/lib/idle/season';
import { sessionConfig } from '@/lib/session-config';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation?: number;
  vr?: number;
};

function spawnParticles(count: number, w: number, h: number, theme: string): Particle[] {
  return Array.from({ length: count }, () => {
    if (theme === 'rain') {
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: -1 + Math.random() * 2,
        vy: 8 + Math.random() * 10,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.5,
      };
    }
    if (theme === 'summer') {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.6,
        size: 2 + Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.35,
      };
    }
    if (theme === 'autumn') {
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: 0.5 + Math.random() * 1.5,
        vy: 1 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.05,
      };
    }
    // snow, diwali, christmas, newyear default to snow-like
    return {
      x: Math.random() * w,
      y: Math.random() * h - h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.5 + Math.random() * 1.5,
      size: 1.5 + Math.random() * 3.5,
      opacity: 0.3 + Math.random() * 0.5,
    };
  });
}

function particleColor(theme: string, dark: boolean): string {
  if (theme === 'rain') return dark ? 'rgba(147, 197, 253, 0.6)' : 'rgba(59, 130, 246, 0.45)';
  if (theme === 'summer') return dark ? 'rgba(251, 191, 36, 0.7)' : 'rgba(245, 158, 11, 0.55)';
  if (theme === 'autumn') return dark ? 'rgba(251, 146, 60, 0.75)' : 'rgba(234, 88, 12, 0.65)';
  if (theme === 'diwali') return 'rgba(251, 191, 36, 0.85)';
  if (theme === 'christmas') return dark ? 'rgba(134, 239, 172, 0.8)' : 'rgba(22, 163, 74, 0.65)';
  if (theme === 'newyear') return dark ? 'rgba(196, 181, 253, 0.85)' : 'rgba(124, 58, 237, 0.6)';
  return dark ? 'rgba(248, 250, 252, 0.85)' : 'rgba(255, 255, 255, 0.9)';
}

type IdleAnimationCanvasProps = {
  className?: string;
};

export function IdleAnimationCanvas({ className }: IdleAnimationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = resolveIdleAnimation(sessionConfig.seasonMode, sessionConfig.idleAnimation);

  useEffect(() => {
    if (!sessionConfig.enableIdleAnimations) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let particles: Particle[] = [];
    let dark = document.documentElement.classList.contains('dark');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = spawnParticles(Math.min(120, Math.floor((w * h) / 12_000)), w, h, theme);
    };

    resize();
    window.addEventListener('resize', resize);

    const observer = new MutationObserver(() => {
      dark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const color = particleColor(theme, dark);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.rotation !== undefined && p.vr !== undefined) p.rotation += p.vr;

        if (p.y > h + 20 || p.x < -20 || p.x > w + 20) {
          p.x = Math.random() * w;
          p.y = theme === 'summer' ? h + 10 : -10;
        }

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = color;

        if (theme === 'rain') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.size * 6);
          ctx.lineWidth = p.size;
          ctx.strokeStyle = color;
          ctx.stroke();
        } else if (theme === 'autumn' && p.rotation !== undefined) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, [theme]);

  if (!sessionConfig.enableIdleAnimations) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}
