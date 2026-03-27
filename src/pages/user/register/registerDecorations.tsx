import React, { useRef, useCallback, useEffect } from 'react';
import type { NetworkNode } from './registerTypes';

export const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const nodesRef = useRef<NetworkNode[]>([]);
  const init = useRef(false);
  const makeNodes = useCallback((w: number, h: number) => {
    const nodes: NetworkNode[] = [];
    for (let i = 0; i < 45; i += 1) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2 + 1.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
    };

    resize();
    if (!init.current) {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        makeNodes(rect.width, rect.height);
      }
      init.current = true;
    }

    const draw = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.015;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 140) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56,189,248,${(1 - distance / 140) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      for (const node of nodes) {
        const glow = Math.sin(node.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * glow + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${0.06 * glow})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${0.5 * glow})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [makeNodes]);

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

const BrandLogo: React.FC<{ children: React.ReactNode; name: string }> = ({ children, name }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <div
      style={{
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  </div>
);

const DockerLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path
      d="M13 4h3v3h-3V4zm-5 0h3v3H8V4zm5 4h3v3h-3V8zM8 8h3v3H8V8zm5 4h3v3h-3v-3zM3 8h3v3H3V8zm5 4h3v3H8v-3zM3 12h3v3H3v-3zm18-1.5c-.7-.5-2.2-.5-3 0-.2-1.2-1-2.2-2-2.8l-.5-.3-.3.5c-.4.7-.5 1.8-.2 2.6.2.4.5.9 1 1.2-.5.3-1.3.5-2.5.5H.5l-.1.8c0 1.5.3 3 1 4.2 1 1.5 2.5 2.2 4.5 2.2 3.5 0 6.2-1.6 7.5-4.5.5 0 1.5 0 2-.8.1-.1.3-.5.4-.8l.1-.3-.4-.3z"
      fill="#2496ed"
    />
  </svg>
);

const K8sLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path d="M12 1L3 5.5v5c0 5 3.8 9.7 9 10.5 5.2-.8 9-5.5 9-10.5v-5L12 1z" fill="#326ce5" opacity=".9" />
    <path
      d="M12 6l-1 3.3-2.8-2 .7 3.3-3.3.7 2.8 2L5 14.3l3.3.7.7 3.3 2-2.8L12 18l1-2.5 2 2.8.7-3.3 3.3-.7-3.3-1 2.8-2-3.3-.7.7-3.3-2.8 2L12 6z"
      fill="#fff"
      opacity=".9"
    />
  </svg>
);

const RedHatLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="10" fill="#ee0000" />
    <path d="M7 12c0-1 .5-2 1.5-2.5S11 9 12 9s2.5.5 3.5 1S17 11 17 12s-.5 2-1.5 2.5-2.5.5-3.5.5-2.5-.5-3.5-1S7 13 7 12z" fill="#fff" />
  </svg>
);

const AnsibleLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="10" fill="#1a1918" />
    <path d="M12 5l-5 11h2.5l2.5-5.5 3 5.5h2.5L12 5z" fill="#fff" />
  </svg>
);

const PrometheusLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="10" fill="#e6522c" />
    <path
      d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 2c1 0 2 .5 2 1.5 0 1.5-2 2-2 3v1h-1v-1c0-1 2-1.5 2-3 0-.5-.5-1-1-1s-1 .5-1 1H10c0-1 1-1.5 2-1.5zM11.5 13h1v1h-1v-1z"
      fill="#fff"
      opacity=".8"
    />
  </svg>
);

const GrafanaLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="10" fill="#f46800" />
    <rect x="7" y="10" width="2" height="6" rx=".5" fill="#fff" />
    <rect x="11" y="7" width="2" height="9" rx=".5" fill="#fff" />
    <rect x="15" y="9" width="2" height="7" rx=".5" fill="#fff" />
  </svg>
);

const TerraformLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path d="M9 4v6l5 3V7l-5-3z" fill="#7b42bc" />
    <path d="M15 7v6l5-3V4l-5 3z" fill="#7b42bc" opacity=".6" />
    <path d="M9 14v6l5 3v-6l-5-3z" fill="#7b42bc" />
    <path d="M3 7v6l5 3V10L3 7z" fill="#7b42bc" opacity=".4" />
  </svg>
);

const JenkinsLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="10" fill="#d33833" />
    <path d="M12 6c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z" fill="#fff" opacity=".85" />
  </svg>
);

const ElasticLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#00bfb3" />
    <path d="M6 8h12M6 12h12M6 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const VaultLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path d="M12 2L3 20h18L12 2z" fill="#000" />
    <path d="M12 7l-5 10h10L12 7z" fill="#ffd814" opacity=".8" />
  </svg>
);

export {
  BrandLogo,
  DockerLogo,
  K8sLogo,
  RedHatLogo,
  AnsibleLogo,
  PrometheusLogo,
  GrafanaLogo,
  TerraformLogo,
  JenkinsLogo,
  ElasticLogo,
  VaultLogo,
};
