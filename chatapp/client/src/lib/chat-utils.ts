import { formatDistanceToNow } from "date-fns";

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diff = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'long' });
  } else {
    return formatDistanceToNow(messageDate, { addSuffix: true });
  }
}

export function formatLastSeen(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function groupMessagesByDate(messages: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function generateMessageId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

export function getMessagePreview(message: any): string {
  if (message.messageType === 'image') {
    return '📷 Photo';
  }
  return truncateMessage(message.content);
}

export function scrollToBottom(element: HTMLElement): void {
  element.scrollTop = element.scrollHeight;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}
