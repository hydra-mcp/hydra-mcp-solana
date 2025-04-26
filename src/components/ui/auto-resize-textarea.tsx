import * as React from "react";
import { cn } from "@/lib/utils";
import TextareaAutosize from "react-textarea-autosize";

export interface AutoResizeTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    minRows?: number;
    maxRows?: number;
}

const AutoResizeTextarea = React.forwardRef<
    HTMLTextAreaElement,
    AutoResizeTextareaProps
>(({ className, minRows = 1, maxRows = 8, ...props }, ref) => {
    return (
        // @ts-ignore: react-textarea-autosize has type issues with className
        <TextareaAutosize
            ref={ref}
            minRows={minRows}
            maxRows={maxRows}
            className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none",
                "focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea }; 