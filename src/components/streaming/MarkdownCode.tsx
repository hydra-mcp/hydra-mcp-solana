import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';

export default function MarkdownCode(props: any) {
    const { node, inline, className, children, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    const content = String(children).replace(/\n$/, '');

    if (inline) {
        return (
            <code
                className={cn(
                    "px-1 py-0.5 bg-muted/30 text-primary-foreground font-mono text-[0.9em] rounded",
                    className
                )}
                {...rest}
            >
                {children}
            </code>
        );
    }

    const language = match ? match[1] : '';

    return (
        <CodeBlock
            content={content}
            language={language}
            fileName=""
            showLineNumbers
            isSimple={content.split('\n').length === 1 && content.length < 30}
        />
    );
}