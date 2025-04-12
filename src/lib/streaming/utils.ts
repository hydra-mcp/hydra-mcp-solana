/**
 * Streaming communication utility functions
 */

/**
 * Format date time
 * Convert ISO format date string to a more friendly display format
 * 
 * @param dateStr ISO format date string
 * @returns Formatted string
 */
export function formatTime(dateStr: string): string {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);

        // Check if it's today
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        if (isToday) {
            // If it's today, display time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Otherwise, display date and time
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' ' +
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (error) {
        console.error('Date formatting error:', error);
        return dateStr;
    }
}

/**
 * Generate unique identifier
 * 
 * @returns Unique ID string
 */
export function nanoid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Throttle function
 * Limit the execution frequency of the function
 * 
 * @param fn Function to throttle
 * @param delay Delay time (milliseconds)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

/**
 * Truncate text
 * Truncate the text and add ellipsis
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Check if the value is an object
 */
function isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Parse event stream data
 */
export function parseEventStreamData(data: string): { event: string; data: string } | null {
    if (!data || data.trim() === '') return null;

    const lines = data.split('\n');
    let event = 'message';
    let dataContent = '';

    for (const line of lines) {
        if (line.startsWith('event:')) {
            event = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
            dataContent = line.substring(5).trim();
        }
    }

    return { event, data: dataContent };
} 