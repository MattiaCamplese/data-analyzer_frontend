"use client";

import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { DesktopNav } from "./desktop-nav";
import { Button } from "./button";
import { MobileNav } from "./mobile-nav";
import { useScroll } from "@/hooks/use-scroll";


export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn("sticky top-0 z-50 w-full border-transparent border-b", {
				"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<div className="flex items-center gap-5">
					<a
						className="rounded-lg px-3 py-2.5 hover:bg-muted dark:hover:bg-muted/50"
						href="#"
					>
						<Logo className="h-4" />
					</a>
					<DesktopNav />
				</div>
				<div className="hidden items-center gap-2 md:flex">
					<Button variant="outline">Sign In</Button>
					<Button>Get Started</Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
