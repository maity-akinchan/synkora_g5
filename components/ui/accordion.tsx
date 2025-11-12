import * as React from "react";
import { cn } from "@/lib/utils";

type AccordionContextType = {
	openValue: string | null;
	setOpenValue: (value: string | null) => void;
	collapsible?: boolean;
};

const AccordionContext = React.createContext<AccordionContextType | null>(null);

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & {
	collapsible?: boolean;
	type?: "single" | "multiple";
};

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
	{ className, children, collapsible = true, type = "single", ...props },
	ref
) {
	const [openValue, setOpenValue] = React.useState<string | null>(null);

	return (
		<AccordionContext.Provider value={{ openValue, setOpenValue, collapsible }}>
			<div ref={ref} className={cn("w-full space-y-2", className)} {...props}>
				{children}
			</div>
		</AccordionContext.Provider>
	);
});

const AccordionItemContext = React.createContext<{ value?: string; isOpen: boolean } | null>(null);

type AccordionItemProps = React.HTMLAttributes<HTMLDivElement> & {
	value?: string;
};
export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
	{ className, children, value, ...props },
	ref
) {
	const ctx = React.useContext(AccordionContext);
	const isOpen = ctx?.openValue === value;

	return (
		<AccordionItemContext.Provider value={{ value, isOpen }}>
			<div
				ref={ref}
				className={cn("rounded-md border border-white/10 bg-white/5", className)}
				{...props}
			>
				{React.Children.map(children, (child) => {
					if (React.isValidElement(child)) {
						return React.cloneElement(child, { ...child.props, value, isOpen });
					}
					return child;
				})}
			</div>
		</AccordionItemContext.Provider>
	);
});

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	children: React.ReactNode;
	value?: string;
	isOpen?: boolean;
};
export const AccordionTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(function AccordionTrigger(
	{ className, children, value, isOpen = false, ...props },
	ref
) {
	const ctx = React.useContext(AccordionContext);
	
	const handleClick = () => {
		if (!ctx) return;
		if (ctx.openValue === value && ctx.collapsible) {
			ctx.setOpenValue(null);
		} else {
			ctx.setOpenValue(value || null);
		}
	};

	return (
		<button
			ref={ref}
			type="button"
			onClick={handleClick}
			className={cn(
				"flex w-full items-center justify-between gap-4 py-4 text-left text-white",
				"transition-colors hover:text-white",
				className
			)}
			{...props}
		>
			{children}
			<span
				className={cn(
					"ml-2 inline-block h-4 w-4 transform rounded-sm border border-white/30 transition-transform",
					isOpen ? "rotate-180" : "",
					"relative before:absolute before:left-1/2 before:top-1/2 before:block before:h-[1px] before:w-2.5 before:-translate-x-1/2 before:-translate-y-1/2 before:bg-white/70",
					afterClasses(isOpen)
				)}
			/>
		</button>
	);
});

function afterClasses(isOpen: boolean) {
	return isOpen
		? "after:absolute after:left-1/2 after:top-1/2 after:block after:h-0 after:w-0"
		: "after:absolute after:left-1/2 after:top-1/2 after:block after:h-2.5 after:w-[1px] after:-translate-x-1/2 after:-translate-y-1/2 after:bg-white/70";
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
	isOpen?: boolean;
	value?: string;
};
export const AccordionContent = React.forwardRef<HTMLDivElement, ContentProps>(function AccordionContent(
	{ className, children, isOpen: propIsOpen, value: propValue, ...props },
	ref
) {
	const itemCtx = React.useContext(AccordionItemContext);
	const isOpen = itemCtx?.isOpen ?? propIsOpen ?? false;
	
	return (
		<div
			ref={ref}
			className={cn(
				"grid overflow-hidden px-1 transition-all duration-300 ease-out",
				isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-80",
				className
			)}
			{...props}
		>
			<div className="min-h-0 px-3 pb-4 pt-0 text-white/70">{children}</div>
		</div>
	);
});


