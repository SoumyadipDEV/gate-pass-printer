export function generateGatePassNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Generate a random 4-digit sequence for this session
  const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  
  return `SDLGP${year}${month}${day}-${sequence}`;
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
