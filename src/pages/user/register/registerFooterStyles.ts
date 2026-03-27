export const registerFooterStyles = {
  featureStrip: {
    display: 'flex',
    gap: 0,
    borderTop: '1px solid #e5e7eb',
    position: 'relative',
    zIndex: 1,
  },
  featureItem: {
    flex: 1,
    padding: '11px 6px',
    textAlign: 'center',
    borderRight: '1px solid #e5e7eb',
    '&:last-child': {
      borderRight: 'none',
    },
  },
  featureIcon: {
    fontSize: 15,
    color: '#2563eb',
    display: 'block',
    marginBottom: 3,
  },
  featureText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 500,
  },
  bottomInfo: {
    position: 'relative',
    zIndex: 1,
    padding: '10px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secBadges: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: 500,
  },
  badgeIco: {
    color: '#22c55e',
    fontSize: 11,
  },
  copyright: {
    fontSize: 10,
    color: '#d1d5db',
  },
} as const;
