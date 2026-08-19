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
    <div data-testid="security-badge" data-mode={mode} className={`badge badge-${mode}`}>
      <span>{content.icon}</span>
      <span>{content.text}</span>
    </div>
  );
}