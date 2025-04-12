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

// 添加throttle函数用于限制函数调用频率
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> {
  let lastCall = 0;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();
    lastArgs = args;

    // 如果距离上次调用的时间超过了限制，立即执行
    if (now - lastCall >= limit) {
      lastCall = now;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return func(...args);
    }

    // 否则，等待剩余时间后执行最新的参数
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          lastCall = Date.now();
          func(...lastArgs);
          lastArgs = null;
          timeoutId = null;
        }
      }, limit - (now - lastCall));
    }

    // 对于没有立即执行的情况，返回一个空值
    return undefined as unknown as ReturnType<T>;
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
