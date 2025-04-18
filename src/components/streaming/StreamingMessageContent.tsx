import React from 'react';
import { cn } from '@/lib/utils';
import { StreamingMessage } from '@/lib/streaming/types';
import { Loader2, AlertCircle, AlertTriangle, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ui/code-block';

interface StreamingMessageContentProps {
    message: StreamingMessage;
    className?: string;
}

export function StreamingMessageContent({ message, className }: StreamingMessageContentProps) {
    // Handle empty content
    if (!message.content && message.status === 'pending') {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
        );
    }

    // Handle error status
    if (message.status === 'error') {
        const errorType = message.metadata?.errorType || 'unknown';
        const errorStatus = message.metadata?.errorStatus;

        // Handle different types of errors
        if (errorType === 'auth_error' || errorStatus === 401) {
            return (
                <div className="flex items-start space-x-2 text-red-500">
                    <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{message.content || 'Authentication expired, please login again'}</p>
                        <p className="text-sm text-red-400 mt-1">Your session has expired, please refresh the page or login again to continue using.</p>
                    </div>
                </div>
            );
        }

        // Handle connection errors
        if (errorType === 'connection_error') {
            return (
                <div className="flex items-start space-x-2 text-red-500">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{message.content || 'Connection error'}</p>
                        <p className="text-sm text-red-400 mt-1">
                            {/* {errorStatus ? `Server returned error (${errorStatus})` : 'Cannot connect to the server, please check your network connection or try again later.'} */}
                        </p>
                    </div>
                </div>
            );
        }

        // Generic error
        return (
            <div className="flex items-start space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                    <p>{message.content || 'Error occurred while generating response.'}</p>
                    {/* {errorStatus && <p className="text-sm text-red-400 mt-1">Error code: {errorStatus}</p>} */}
                </div>
            </div>
        );
    }

    // Handle streaming text (possibly Markdown)
    return (
        <div className={cn('prose dark:prose-invert', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
            // components={{
            //     code({ node, inline, className, children, ...props }: any) {
            //         const match = /language-(\w+)/.exec(className || '');

            //         if (inline) {
            //             return (
            //                 <code className={cn('px-1 py-0.5 rounded-md bg-muted', className)} {...props}>
            //                     {children}
            //                 </code>
            //             );
            //         }

            //         const language = match ? match[1] : '';
            //         const content = String(children).replace(/\n$/, '');

            //         return (
            //             <CodeBlock
            //                 content={content}
            //                 language={language}
            //                 fileName=""
            //                 showLineNumbers
            //             />
            //         );
            //     },
            //     pre({ children }: any) {
            //         return <>{children}</>;
            //     }
            // }}
            >
                {message.content}
            </ReactMarkdown>

            {/* Streaming status indicator */}
            {message.status === 'streaming' && (
                <div className="w-2 h-4 bg-primary animate-blink inline-block ml-0.5" />
            )}
        </div>
    );
} 