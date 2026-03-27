import React, { useCallback, useEffect, useRef } from 'react';
import type { NetworkNode } from './loginTypes';

const buildNodes = (count: number, width: number, height: number): NetworkNode[] => {
  const nodes: NetworkNode[] = [];
  for (let i = 0; i < count; i += 1) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 2 + 1.2,
      pulse: Math.random() * Math.PI * 2,
    });
  }
  return nodes;
};

const drawLines = (ctx: CanvasRenderingContext2D, ns: NetworkNode[]) => {
  const width = ctx.canvas.width / devicePixelRatio;
  const height = ctx.canvas.height / devicePixelRatio;
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < ns.length; i += 1) {
    for (let j = i + 1; j < ns.length; j += 1) {
      const dx = ns[i].x - ns[j].x;
      const dy = ns[i].y - ns[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 140) {
        ctx.beginPath();
        ctx.moveTo(ns[i].x, ns[i].y);
        ctx.lineTo(ns[j].x, ns[j].y);
        ctx.strokeStyle = `rgba(56,189,248,${(1 - distance / 140) * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
};

const drawNodes = (ctx: CanvasRenderingContext2D, ns: NetworkNode[]) => {
  const width = ctx.canvas.width / devicePixelRatio;
  const height = ctx.canvas.height / devicePixelRatio;
  for (const node of ns) {
    node.x += node.vx;
    node.y += node.vy;
    node.pulse += 0.015;
    if (node.x < 0 || node.x > width) node.vx *= -1;
    if (node.y < 0 || node.y > height) node.vy *= -1;
    const intensity = Math.sin(node.pulse) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r * intensity + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56,189,248,${0.06 * intensity})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56,189,248,${0.5 * intensity})`;
    ctx.fill();
  }
};

const resizeCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const rect = canvas.parentElement?.getBoundingClientRect();
  if (!rect) return;
  const { width, height } = rect;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

export const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NetworkNode[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const initialized = useRef(false);

  const regenerate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!initialized.current) {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        nodesRef.current = buildNodes(45, rect.width, rect.height);
        initialized.current = true;
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const render = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        resizeCanvas(canvas, ctx);
      }
      if (!initialized.current && rect) {
        nodesRef.current = buildNodes(45, rect.width, rect.height);
        initialized.current = true;
      }
      drawLines(ctx, nodesRef.current);
      drawNodes(ctx, nodesRef.current);
      animationRef.current = requestAnimationFrame(render);
    };

    const handleResize = () => {
      resizeCanvas(canvas, ctx);
    };

    render();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [regenerate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};
