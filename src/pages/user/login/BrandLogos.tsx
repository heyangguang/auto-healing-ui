import React from 'react';

type BrandLogoProps = {
  children: React.ReactNode;
  name: string;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ children, name }) => (
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

const svgProps = { 'aria-hidden': true, viewBox: '0 0 24 24', width: 18, height: 18 };

export const DockerLogo = () => (
  <svg {...svgProps}>
    <title>Docker</title>
    <path
      d="M13 4h3v3h-3V4zm-5 0h3v3H8V4zm5 4h3v3h-3V8zM8 8h3v3H8V8zm5 4h3v3h-3v-3zM3 8h3v3H3V8zm5 4h3v3H8v-3zM3 12h3v3H3v-3zm18-1.5c-.7-.5-2.2-.5-3 0-.2-1.2-1-2.2-2-2.8l-.5-.3-.3.5c-.4.7-.5 1.8-.2 2.6.2.4.5.9 1 1.2-.5.3-1.3.5-2.5.5H.5l-.1.8c0 1.5.3 3 1 4.2 1 1.5 2.5 2.2 4.5 2.2 3.5 0 6.2-1.6 7.5-4.5.5 0 1.5 0 2-.8.1-.1.3-.5.4-.8l.1-.3-.4-.3z"
      fill="#2496ed"
    />
  </svg>
);

export const K8sLogo = () => (
  <svg {...svgProps}>
    <title>Kubernetes</title>
    <path d="M12 1L3 5.5v5c0 5 3.8 9.7 9 10.5 5.2-.8 9-5.5 9-10.5v-5L12 1z" fill="#326ce5" opacity=".9" />
    <path
      d="M12 6l-1 3.3-2.8-2 .7 3.3-3.3.7 2.8 2L5 14.3l3.3.7.7 3.3 2-2.8L12 18l1-2.5 2 2.8.7-3.3 3.3-.7-3.3-1 2.8-2-3.3-.7.7-3.3-2.8 2L12 6z"
      fill="#fff"
      opacity=".9"
    />
  </svg>
);

export const RedHatLogo = () => (
  <svg {...svgProps}>
    <title>Red Hat</title>
    <circle cx="12" cy="12" r="10" fill="#ee0000" />
    <path d="M7 12c0-1 .5-2 1.5-2.5S11 9 12 9s2.5.5 3.5 1S17 11 17 12s-.5 2-1.5 2.5-2.5.5-3.5.5-2.5-.5-3.5-1S7 13 7 12z" fill="#fff" />
  </svg>
);

export const AnsibleLogo = () => (
  <svg {...svgProps}>
    <title>Ansible</title>
    <circle cx="12" cy="12" r="10" fill="#1a1918" />
    <path d="M12 5l-5 11h2.5l2.5-5.5 3 5.5h2.5L12 5z" fill="#fff" />
  </svg>
);

export const PrometheusLogo = () => (
  <svg {...svgProps}>
    <title>Prometheus</title>
    <circle cx="12" cy="12" r="10" fill="#e6522c" />
    <path
      d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 2c1 0 2 .5 2 1.5 0 1.5-2 2-2 3v1h-1v-1c0-1 2-1.5 2-3 0-.5-.5-1-1-1s-1 .5-1 1H10c0-1 1-1.5 2-1.5zM11.5 13h1v1h-1v-1z"
      fill="#fff"
      opacity=".8"
    />
  </svg>
);

export const GrafanaLogo = () => (
  <svg {...svgProps}>
    <title>Grafana</title>
    <circle cx="12" cy="12" r="10" fill="#f46800" />
    <rect x="7" y="10" width="2" height="6" rx="0.5" fill="#fff" />
    <rect x="11" y="7" width="2" height="9" rx="0.5" fill="#fff" />
    <rect x="15" y="9" width="2" height="7" rx="0.5" fill="#fff" />
  </svg>
);

export const TerraformLogo = () => (
  <svg {...svgProps}>
    <title>Terraform</title>
    <path d="M9 4v6l5 3V7l-5-3z" fill="#7b42bc" />
    <path d="M15 7v6l5-3V4l-5 3z" fill="#7b42bc" opacity=".6" />
    <path d="M9 14v6l5 3v-6l-5-3z" fill="#7b42bc" />
    <path d="M3 7v6l5 3V10L3 7z" fill="#7b42bc" opacity=".4" />
  </svg>
);

export const JenkinsLogo = () => (
  <svg {...svgProps}>
    <title>Jenkins</title>
    <circle cx="12" cy="12" r="10" fill="#d33833" />
    <path d="M12 6c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z" fill="#fff" opacity=".85" />
  </svg>
);

export const ElasticLogo = () => (
  <svg {...svgProps}>
    <title>Elastic</title>
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#00bfb3" />
    <path d="M6 8h12M6 12h12M6 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const VaultLogo = () => (
  <svg {...svgProps}>
    <title>Vault</title>
    <path d="M12 2L3 20h18L12 2z" fill="#000" />
    <path d="M12 7l-5 10h10L12 7z" fill="#ffd814" opacity=".8" />
  </svg>
);
