import { format, isToday, isYesterday, isSameDay } from 'date-fns';

/**
 * Formats a timestamp as relative time (e.g., "2 minutes ago", "Yesterday at 3:45 PM")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const date = new Date(timestamp);

    const minutesAgo = Math.floor((now - timestamp) / 60000);
    const hoursAgo = Math.floor((now - timestamp) / 3600000);
    const daysAgo = Math.floor((now - timestamp) / 86400000);

    // Less than 1 minute
    if (minutesAgo < 1) {
        return 'just now';
    }

    // Less than 60 minutes
    if (minutesAgo < 60) {
        return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than 24 hours
    if (hoursAgo < 24) {
        return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
    }

    // Yesterday
    if (daysAgo === 1) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
    }

    // Less than 7 days
    if (daysAgo < 7) {
        return format(date, 'EEEE \'at\' h:mm a'); // e.g., "Monday at 3:45 PM"
    }

    // 7 days or more
    return format(date, 'MMM dd, yyyy \'at\' h:mm a'); // e.g., "Dec 04, 2025 at 3:45 PM"
}

/**
 * Formats a timestamp as absolute time for tooltips
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted absolute time string
 */
export function formatAbsoluteTime(timestamp: number): string {
    const date = new Date(timestamp);
    return format(date, 'EEEE, MMMM dd, yyyy \'at\' h:mm:ss a');
    // e.g., "Wednesday, December 04, 2025 at 3:45:30 PM"
}

/**
 * Formats a date separator label
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date separator string
 */
export function formatDateSeparator(timestamp: number): string {
    const date = new Date(timestamp);

    if (isToday(date)) {
        return 'Today';
    }

    if (isYesterday(date)) {
        return 'Yesterday';
    }

    // Within current year
    const now = new Date();
    if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'EEEE, MMMM dd'); // e.g., "Monday, December 02"
    }

    // Different year
    return format(date, 'EEEE, MMMM dd, yyyy'); // e.g., "Monday, December 02, 2024"
}

/**
 * Checks if two timestamps are on the same day
 * @param timestamp1 - First timestamp in milliseconds
 * @param timestamp2 - Second timestamp in milliseconds
 * @returns True if same day
 */
export function isSameDate(timestamp1: number, timestamp2: number): boolean {
    return isSameDay(new Date(timestamp1), new Date(timestamp2));
}

/**
 * Determines how many milliseconds until the timestamp display should update
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Milliseconds until next update
 */
export function shouldUpdateTimestamp(timestamp: number): number {
    const now = Date.now();
    const minutesAgo = Math.floor((now - timestamp) / 60000);

    // Update every 10 seconds for recent messages (< 5 minutes)
    if (minutesAgo < 5) {
        return 10000;
    }

    // Update every minute for messages < 1 hour
    if (minutesAgo < 60) {
        return 60000;
    }

    // Update every 5 minutes for messages < 24 hours
    const hoursAgo = Math.floor((now - timestamp) / 3600000);
    if (hoursAgo < 24) {
        return 300000; // 5 minutes
    }

    // Update every hour for older messages
    return 3600000; // 1 hour
}
