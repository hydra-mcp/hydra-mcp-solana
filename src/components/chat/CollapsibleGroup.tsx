import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleGroupProps {
    title: string;
    count: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function CollapsibleGroup({
    title,
    count,
    defaultOpen = true,
    children,
    className,
}: CollapsibleGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={cn("space-y-1", className)}>
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between px-2 h-8 font-medium"
                onClick={toggleOpen}
            >
                <div className="flex items-center">
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 mr-1 transition-transform duration-200",
                            isOpen && "transform rotate-90"
                        )}
                    />
                    <span>{title}</span>
                </div>
                {count > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {count}
                    </span>
                )}
            </Button>
            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden pl-6">{children}</div>
            </div>
        </div>
    );
} 