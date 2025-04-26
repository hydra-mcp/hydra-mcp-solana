import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from '@/hooks/use-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  // generate a prefix sorted by time + a random suffix
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// improve the throttle function, add special handling for the last call, ensure the final state is updated correctly
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { trailing?: boolean } = { trailing: true }
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false;
  let lastResult: ReturnType<T> | undefined;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let timeoutId: NodeJS.Timeout | null = null;

  // ensure the timer is cleared when the component unmounts
  const clearTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    // save the last call context and parameters
    lastArgs = args;
    lastThis = this;

    // if not in throttle, execute the function immediately
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);

      // set the throttle end timer
      timeoutId = setTimeout(() => {
        inThrottle = false;

        // if there is a trailing option and there is a last call, execute it
        if (options.trailing && lastArgs) {
          lastResult = func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }

        timeoutId = null;
      }, limit);
    }

    return lastResult;
  };
}

export async function copyToClipboard(text: string, showToast = true) {
  if (!navigator.clipboard) {
    console.error('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);

    if (showToast) {
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
        duration: 2000,
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);

    if (showToast) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }

    return false;
  }
}

/**
 * Generate a chat title based on the first user message
 * @param message The first user message content
 * @returns A concise title for the chat
 */
export function generateChatTitle(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'New Chat';
  }

  // Trim and limit length
  let title = message.trim();

  // Remove any markdown syntax
  title = title.replace(/[`*_~>#]/g, '');

  // If message is too long, take the first 30 characters and add ellipsis
  if (title.length > 30) {
    // Try to cut at a word boundary
    const truncated = title.substring(0, 30).trim();
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 20) {
      // If there's a space after 20 chars, cut at that space
      title = truncated.substring(0, lastSpaceIndex) + '...';
    } else {
      // Otherwise just cut at 30 chars
      title = truncated + '...';
    }
  }

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title;
}
