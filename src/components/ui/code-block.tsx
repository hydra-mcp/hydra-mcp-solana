import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    content: string;
    language?: string;
    fileName?: string;
    showLineNumbers?: boolean;
    highlightLines?: number[];
    className?: string;
}

export function CodeBlock({
    content,
    language = '',
    fileName = '',
    showLineNumbers = false,
    highlightLines = [],
    className
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = content.split('\n');

    return (
        <div className={cn('relative my-4 rounded-md bg-muted overflow-hidden', className)}>
            {/* File name and language label */}
            {(fileName || language) && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-muted-foreground/10 text-sm text-muted-foreground">
                    <div className="font-medium">
                        {fileName && <span>{fileName}</span>}
                        {fileName && language && <span className="mx-2">·</span>}
                        {language && <span className="text-xs uppercase">{language}</span>}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
            )}

            {/* Code content */}
            <div className="p-4 overflow-auto">
                <pre className="text-sm font-mono">
                    <code>
                        {lines.map((line, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'px-0 py-0.5',
                                    highlightLines?.includes(i + 1) && 'bg-primary/10 border-l-2 border-primary pl-2 -ml-2'
                                )}
                            >
                                {showLineNumbers && (
                                    <span className="inline-block w-10 text-right pr-4 select-none text-muted-foreground/60">
                                        {i + 1}
                                    </span>
                                )}
                                <span>{line || ' '}</span>
                            </div>
                        ))}
                    </code>
                </pre>
            </div>

            {/* Copy button - only show when there is no file name/language label */}
            {!fileName && !language && (
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-muted-foreground/10 hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
} 