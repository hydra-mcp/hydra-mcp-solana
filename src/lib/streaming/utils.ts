/**
 * 流式通信工具函数
 */

/**
 * 格式化日期时间
 * 将ISO格式日期字符串转换为更友好的显示格式
 * 
 * @param dateStr ISO格式日期字符串
 * @returns 格式化后的字符串
 */
export function formatTime(dateStr: string): string {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);

        // 判断是否是今天
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        if (isToday) {
            // 如果是今天，显示时间
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // 否则显示日期和时间
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' ' +
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (error) {
        console.error('日期格式化错误:', error);
        return dateStr;
    }
}

/**
 * 生成唯一标识符
 * 
 * @returns 唯一ID字符串
 */
export function nanoid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 节流函数
 * 限制函数的执行频率
 * 
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
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
 * 截断文本
 * 将过长的文本截断，并添加省略号
 * 
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 深度合并对象
 * 将两个对象深度合并
 * 
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

/**
 * 检查值是否为对象
 */
function isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 解析事件流数据
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