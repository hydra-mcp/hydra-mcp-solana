import React from 'react';
import { cn } from '@/lib/utils';
import { StreamingMessage } from '@/lib/streaming/types';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ui/code-block';

interface StreamingMessageContentProps {
    message: StreamingMessage;
    className?: string;
}

export function StreamingMessageContent({ message, className }: StreamingMessageContentProps) {
    // 处理空内容
    if (!message.content && message.status === 'pending') {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
        );
    }

    // 处理错误状态
    if (message.status === 'error') {
        return (
            <div className="text-red-500">
                {message.content || 'An error occurred while generating the response.'}
            </div>
        );
    }

    // 处理流式文本（可能是Markdown）
    return (
        <div className={cn('prose dark:prose-invert', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');

                        if (inline) {
                            return (
                                <code className={cn('px-1 py-0.5 rounded-md bg-muted', className)} {...props}>
                                    {children}
                                </code>
                            );
                        }

                        const language = match ? match[1] : '';
                        const content = String(children).replace(/\n$/, '');

                        return (
                            <CodeBlock
                                content={content}
                                language={language}
                                fileName=""
                                showLineNumbers
                            />
                        );
                    },
                    pre({ children }: any) {
                        return <>{children}</>;
                    }
                }}
            >
                {message.content}
            </ReactMarkdown>

            {/* 流式状态指示器 */}
            {message.status === 'streaming' && (
                <div className="w-2 h-4 bg-primary animate-blink inline-block ml-0.5" />
            )}
        </div>
    );
} 