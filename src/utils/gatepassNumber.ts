export function getGatePassDateKey(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}${month}${year}`;
}

export function generateGatePassNumber(
  lastGatePassNo?: string,
  date: Date | string = new Date()
): string {
  const dateKey = getGatePassDateKey(date);
  const prefix = `SDLGP${dateKey}-`;

  let sequence = 1;

  if (lastGatePassNo) {
    const trimmed = lastGatePassNo.trim();
    if (trimmed.startsWith(prefix)) {
      const rawSequence = trimmed.slice(prefix.length);
      const parsedSequence = Number.parseInt(rawSequence, 10);
      if (Number.isFinite(parsedSequence) && parsedSequence > 0) {
        sequence = parsedSequence + 1;
      }
    }
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  return dateObj.toLocaleDateString('en-GB', options);
}
