export function formatDate(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'");
}

export function cleanText(value?: string | null) {
  if (!value) {
    return '';
  }

  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value?: string | null, maxLength = 180) {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return '';
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trimEnd()}...`;
}

export function formatTopicPreview(value?: string | null, maxLength = 180) {
  return truncateText(value, maxLength) || 'No brief yet.';
}

export function formatScore(value?: number | string | null) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return 'Unscored';
  }

  return `Score ${Number(numeric).toFixed(2)}`;
}

export function formatPercent(value?: number | null) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Math.round(Number(value) * 100)}%`;
}

export function formatStatus(value?: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .toLowerCase()
    .split(/[_:]/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export function formatTopicSource(value?: string | null) {
  if (!value) {
    return 'Manual';
  }

  if (value === 'DISCOVERY_MANUAL') {
    return 'Manual Discovery';
  }

  if (value.startsWith('DISCOVERY_API:')) {
    return `API ${formatStatus(value.split(':')[1] ?? 'source')}`;
  }

  return formatStatus(value);
}

export function topicStatusTone(status?: string | null) {
  switch (status) {
    case 'APPROVED':
    case 'RESEARCH_READY':
      return 'success';
    case 'REJECTED':
    case 'FAILED':
      return 'danger';
    case 'RESEARCH_IN_PROGRESS':
    case 'RESEARCH_QUEUED':
    case 'SUBMITTED':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function sourceTone(source?: string | null) {
  if (!source) {
    return 'neutral';
  }

  if (source.startsWith('DISCOVERY_API:')) {
    return 'warning';
  }

  if (source === 'DISCOVERY_MANUAL') {
    return 'accent';
  }

  return 'neutral';
}

export function formatUsd(value: number | string) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}
