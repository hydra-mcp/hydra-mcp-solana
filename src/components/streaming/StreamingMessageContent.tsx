import React, { useState, useRef, useEffect, useDeferredValue, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMessage } from '@/lib/streaming/types';
import { Loader2, AlertCircle, AlertTriangle, Lock, Play, Pause, Volume2, ExternalLink, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownLink from './MarkdownLink';
import MarkdownImage from './MarkdownImage';
import MarkdownCode from './MarkdownCode';
interface StreamingMessageContentProps {
    message: StreamingMessage;
    className?: string;
}

function removeSvgEmptyLines(text: string): string {
    // Use regex to match <svg> tag content
    const svgPattern = /(<svg[\s\S]*?<\/svg>)/g

    return text.replace(svgPattern, (svgMatch) => {
        // Split SVG content by line, filter out empty lines, then recombine
        return svgMatch
            .split('\n')
            .filter((line) => line.trim() !== '')
            .join('\n')
    })
}

function escapeBrackets(text: string) {
    const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g
    return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
        if (codeBlock) {
            return codeBlock
        } else if (squareBracket) {
            return `
  $$
  ${squareBracket}
  $$
  `
        } else if (roundBracket) {
            return `$${roundBracket}$`
        }
        return match
    })
}

// Original component function
export function StreamingMessageContent({ message, className }: StreamingMessageContentProps) {
    // Add ref for content container to handle scroll anchoring
    const contentRef = useRef<HTMLDivElement>(null);

    // Defer the content updates passed to ReactMarkdown
    const messageContent = useMemo(() => {
        const content = message.content
        return removeSvgEmptyLines(escapeBrackets(content))
    }, [message])

    // Use useEffect to apply scroll anchoring
    useEffect(() => {
        // When streaming content updates, maintain scroll position relative to content
        if (message.status === 'streaming' && contentRef.current) {
            // Get current scroll position
            const container = contentRef.current.closest('.scroll-area');
            if (container && container.scrollHeight > container.clientHeight) {
                // If we're scrolled near the bottom, keep scrolling as content grows
                const isNearBottom = container.scrollTop + container.clientHeight >=
                    container.scrollHeight - 200;

                if (isNearBottom) {
                    requestAnimationFrame(() => {
                        container.scrollTop = container.scrollHeight;
                    });
                }
            }
        }
    }, [message.content, message.status]);

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
        <div
            ref={contentRef}
            className={cn(
                'prose dark:prose-invert will-change-contents',
                // Add a subtle style when content is deferred (optional)
                // isStale && 'opacity-80 transition-opacity duration-300',
                className
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // img: ({ src, alt, title }) => <MarkdownImage src={src} alt={alt} title={title} />,
                    img: MarkdownImage,
                    a: MarkdownLink,
                    code: MarkdownCode,
                    pre(props: any) {
                        const { children } = props;
                        return <div className="not-prose my-2 rounded-md overflow-hidden">{children}</div>;
                    },
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-muted pl-4 italic my-2" {...props} />
                    ),
                    // pre: ({ node, ...props }) => <pre className="p-0 my-2 bg-transparent" {...props} />,
                    table: ({ node, ...props }) => <table className="w-full border-collapse my-3 text-sm" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-slate-300 dark:border-zinc-700 px-3 py-2 text-left font-semibold bg-slate-100 dark:bg-zinc-800" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-slate-300 dark:border-zinc-700 px-3 py-2 cjk-text" {...props} />,
                }}
            >
                {messageContent}
            </ReactMarkdown>

            {/* Streaming status indicator */}
            {message.status === 'streaming' && (
                <div className="w-2 h-4 bg-primary animate-blink inline-block ml-0.5" />
            )}
        </div>
    );
}