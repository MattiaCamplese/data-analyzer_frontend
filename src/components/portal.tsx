import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type PortalProps = {
	children: React.ReactNode;
	className?: string;
};

export function Portal({ children, className }: PortalProps) {
	return createPortal(
		<div className={cn("fixed inset-x-0 bottom-0 z-40", className)}>
			{children}
		</div>,
		document.body
	);
}

export function PortalBackdrop() {
	return <div className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm" />;
}
