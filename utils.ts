/**
 * Checks if two date objects represent the same calendar day.
 */
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Formats a date for the dashboard header (e.g., "Wednesday, Dec 10").
 */
export const formatDashboardDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a date object to YYYYMMDD string for ESPN API.
 */
export const formatDateForApi = (date: Date): string => {
  // Use UTC to avoid off-by-one when client timezone is ahead/behind venue time
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Returns an array of days for the grid view of a given month.
 * Includes null padding for days belonging to previous/next months
 * to align the grid correctly.
 */
export const getMonthGrid = (year: number, month: number): (Date | null)[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // 0 = Sunday, 1 = Monday, etc.
  const startDayIndex = firstDayOfMonth.getDay(); 
  
  const grid: (Date | null)[] = [];

  // Add padding for start of month
  for (let i = 0; i < startDayIndex; i++) {
    grid.push(null);
  }

  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(new Date(year, month, i));
  }

  return grid;
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];