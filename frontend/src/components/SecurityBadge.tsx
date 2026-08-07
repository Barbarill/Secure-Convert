type SecurityMode = 'local' | 'server';

interface SecurityBadgeProps {
  mode: SecurityMode;
}

const BADGE_CONTENT: Record<SecurityMode, { icon: string; text: string }> = {
  local: {
    icon: '🔒',
    text: 'Elaborazione locale — il file non lascia il tuo dispositivo',
  },
  server: {
    icon: '⏱️',
    text: 'Elaborazione su server effimero — file cancellato automaticamente dopo la conversione',
  },
};

export function SecurityBadge({ mode }: SecurityBadgeProps) {
  const content = BADGE_CONTENT[mode];

  return (
    <div
      data-testid="security-badge"
      data-mode={mode}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8rem',
        padding: '0.3rem 0.7rem',
        borderRadius: '999px',
        backgroundColor: mode === 'local' ? 'rgba(46, 139, 87, 0.1)' : 'rgba(216, 90, 48, 0.1)',
        color: mode === 'local' ? '#2E8B57' : '#D85A30',
      }}
    >
      <span>{content.icon}</span>
      <span>{content.text}</span>
    </div>
  );
}