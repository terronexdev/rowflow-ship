import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getParcelStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: '#bdbdbd', // Grey
    IN_PROGRESS: '#2196f3', // Blue
    ACQUIRED: '#4caf50', // Green
    CONDEMNED: '#f44336', // Red
    RELOCATED: '#ff9800', // Orange
  };
  return colors[status] || colors.NOT_STARTED;
}

export function getParcelStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    ACQUIRED: 'Acquired',
    CONDEMNED: 'Condemned',
    RELOCATED: 'Relocated',
  };
  return labels[status] || status;
}

export function calculateProgress(
  total: number,
  completed: number
): { percentage: number; remaining: number } {
  if (total === 0) return { percentage: 0, remaining: 0 };
  const percentage = Math.round((completed / total) * 100);
  const remaining = total - completed;
  return { percentage, remaining };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

