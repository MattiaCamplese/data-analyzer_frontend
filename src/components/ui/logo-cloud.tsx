export function LogoCloud() {
	return (
		<div className="relative overflow-hidden py-6 mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
			<div className="animate-marquee flex w-max items-center gap-x-14">
				{[...logos, ...logos].map((logo, i) => (
					<img
						alt={logo.alt}
						className="pointer-events-none h-5 w-fit select-none dark:brightness-0 dark:invert"
						height="auto"
						key={`${logo.alt}-${i}`}
						loading="lazy"
						src={logo.src}
						width="auto"
					/>
				))}
			</div>
		</div>
	);
}

const logos = [
	{
		src: "https://storage.efferd.com/logo/vercel-wordmark.svg",
		alt: "Vercel Logo",
	},
	{
		src: "https://storage.efferd.com/logo/supabase-wordmark.svg",
		alt: "Supabase Logo",
	},
	{
		src: "https://storage.efferd.com/logo/openai-wordmark.svg",
		alt: "OpenAI Logo",
	},
	{
		src: "https://storage.efferd.com/logo/dub-wordmark.svg",
		alt: "Dub Logo",
	},
	{
		src: "https://storage.efferd.com/logo/turso-wordmark.svg",
		alt: "Turso Logo",
	},

	{
		src: "https://storage.efferd.com/logo/github-wordmark.svg",
		alt: "GitHub Logo",
	},
	{
		src: "https://storage.efferd.com/logo/claude-wordmark.svg",
		alt: "Claude AI Logo",
	},
	{
		src: "https://storage.efferd.com/logo/nvidia-wordmark.svg",
		alt: "Nvidia Logo",
	},
	{
		src: "https://storage.efferd.com/logo/clerk-wordmark.svg",
		alt: "Clerk Logo",
	},
	{
		src: "https://storage.efferd.com/logo/bolt-wordmark.svg",
		alt: "Bolt Logo",
	},

	{
		src: "https://storage.efferd.com/logo/stripe-wordmark.svg",
		alt: "Stripe Logo",
	},
];
