import * as React from "react";
import { clsx } from "clsx";
import { TextTooltip } from "@quri/ui";

export const MenuItem: React.FC<{
    icon?: (props: React.ComponentProps<"svg">) => JSX.Element;
    children?: React.ReactNode;
    iconClasses?: string;
    iconColorClasses?: string;
    iconSpin?: boolean;
    onClick?: () => void;
    tooltipText?: string;
}> = ({
    icon: Icon,
    iconColorClasses,
    iconSpin,
    onClick,
    tooltipText,
    children,
}) => {
        const withTooltip = (jsx: JSX.Element) => (
            <TextTooltip text={tooltipText || ""} placement="bottom" offset={5}>
                {jsx}
            </TextTooltip>
        );
        const main = <div className={"flex items-center text-slate-800 space-x-1 text-sm px-3 py-2 cursor-pointer rounded-sm hover:bg-slate-200 select-none whitespace-nowrap"} onClick={onClick}>
            {Icon && (
                <Icon
                    className={clsx("h-4 w-4 flex-shrink-0", iconColorClasses || "text-slate-400", iconSpin && "animate-spin")}
                />
            )}
            {children && (
                <div className="flex">
                    {children}
                </div>
            )}
        </div>

        return tooltipText ? withTooltip(main) : main;
    }
