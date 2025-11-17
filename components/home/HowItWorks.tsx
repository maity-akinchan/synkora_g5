"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, Shuffle, Fingerprint, Star, Play } from "lucide-react";
import { useRef, useState, MouseEvent, useEffect } from "react";
import Image from "next/image";
import BlurText from "@/components/home/BlurText";

const steps = [
	{
		icon: Package,
		title: "Set your workspace",
		description: "Create a project, invite your team, and define your collaboration style.",
		color: "text-[#B8FF14]",
	},
	{
		icon: Shuffle,
		title: "Collaborate & visualize",
		description: "Plan, brainstorm, and build together — with AI-assisted clarity and real-time updates.",
		color: "text-blue-400",
	},
	{
		icon: Fingerprint,
		title: "Stay in sync",
		description: "Synkora keeps your team connected and your projects evolving — no matter the scale.",
		color: "text-purple-400",
	},
];

type TiltCardProps = {
	children: React.ReactNode;
	index?: number;
};

const TiltCard = ({ children, index = 0 }: TiltCardProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [style, setStyle] = useState<React.CSSProperties>({});

	// Define colors for each card: Pink, Blue, Purple
	const colorConfigs = [
		{
			// Pink
			gradient: "rgba(236, 72, 153, 0.15)",
			border: "rgba(236, 72, 153, 0.4)",
			shadow: "rgba(236, 72, 153, 0.2)",
			spotlight: "rgba(236, 72, 153, 0.08)",
		},
		{
			// Blue
			gradient: "rgba(59, 130, 246, 0.15)",
			border: "rgba(59, 130, 246, 0.4)",
			shadow: "rgba(59, 130, 246, 0.2)",
			spotlight: "rgba(59, 130, 246, 0.08)",
		},
		{
			// Purple
			gradient: "rgba(168, 85, 247, 0.15)",
			border: "rgba(168, 85, 247, 0.4)",
			shadow: "rgba(168, 85, 247, 0.2)",
			spotlight: "rgba(168, 85, 247, 0.08)",
		},
	];

	const colors = colorConfigs[index % 3];

	const handleMove = (e: MouseEvent<HTMLDivElement>) => {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const px = x / rect.width;
		const py = y / rect.height;
		const rotateX = (py - 0.5) * -8;
		const rotateY = (px - 0.5) * 8;
		setStyle({
			transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
			background: `radial-gradient(500px circle at ${x}px ${y}px, ${colors.spotlight}, transparent 40%)`,
			transition: "transform 120ms ease-out, background 200ms ease-out",
		});
	};

	const handleLeave = () => {
		setStyle({
			transform: "rotateX(0deg) rotateY(0deg)",
			transition: "transform 300ms ease-in",
		});
	};

	return (
		<div className="relative [perspective:1000px] group animate-slide-up" style={{ animationDelay: `${index * 200}ms` }}>
			<Card
				ref={ref as any}
				onMouseMove={handleMove}
				onMouseLeave={handleLeave}
				className="bg-black/40 border-white/10 transition-all duration-300 group-hover:border-opacity-100 [transform-style:preserve-3d] transform-gpu"
				style={{
					...style,
					"--card-border": colors.border,
				} as React.CSSProperties & { "--card-border": string }}
			>
				<CardContent className="p-0">{children}</CardContent>
			</Card>
			<div
				className="pointer-events-none absolute -inset-px rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 border"
				style={{
					background: `radial-gradient(400px circle at 50% 0, ${colors.gradient}, transparent 60%)`,
					borderColor: colors.border,
					boxShadow: `0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px ${colors.border}`,
				}}
			/>
		</div>
	);
};

const stats = [
	{ value: "45+", label: "Happy customers" },
	{ value: "5k+", label: "Hours spent on craft" },
	{ value: "4.8", label: "Review rate" },
];

const useCountUp = (target: number, durationMs = 1200) => {
	const [value, setValue] = useState(0);
	useEffect(() => {
		let raf = 0;
		const start = performance.now();
		const tick = () => {
			const t = Math.min(1, (performance.now() - start) / durationMs);
			setValue(Math.floor(target * (1 - Math.pow(1 - t, 3))));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, durationMs]);
	return value;
};

const StarRow = () => (
	<div className="flex items-center gap-1 text-[#FFD54A]">
		{Array.from({ length: 5 }).map((_, i) => (
			<Star key={i} className="h-4 w-4 fill-[#FFD54A] text-[#FFD54A]" />
		))}
	</div>
);

const Testimonials = () => {
	const ref = useRef<HTMLDivElement>(null);
	const customers = useCountUp(45);
	const hours = useCountUp(5000);
	const review = useCountUp(48);

	return (
		<div className="mt-20" ref={ref}>
			
			
			
			{/* Top customer story */}
			<div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
				<div>
					<div className="inline-flex items-center px-3 py-1.5 bg-[#B8FF14]/15 border border-[#B8FF14]/20 rounded-full text-xs text-[#B8FF14] mb-6">
						<div className="w-2 h-2 rounded-full bg-[#B8FF14] mr-2" /> Customer story
					</div>
					<p className="text-3xl md:text-4xl font-semibold text-white/90">
						“We cut 50% of project delays and aligned remote teams — without adding new tools.”
					</p>
					<div className="mt-6 text-sm text-white/60">Read the story →</div>
				</div>
				<div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/5 group cursor-pointer">
					<Image
						src="/images/testimonial-video.jpg"
						alt="Johnny Seedapple - Technical Lead/Product Manager"
						fill
						className="object-cover"
						priority
					/>
					{/* Play button overlay */}
					<div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
						<div className="flex flex-col items-center gap-2">
							<div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
							</div>
							<div className="text-white text-sm font-medium mt-2">Johnny Seedapple</div>
							<div className="text-white/80 text-xs">Technical Lead/Product Manager</div>
						</div>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="my-12 h-px w-full bg-white/10" />

			{/* Three company quotes */}
			<div className="grid grid-cols-1 gap-10 md:grid-cols-3">
				<div>
					<div className="text-white/80 font-semibold mb-3">loom</div>
					<p className="text-white/60 text-sm">“Synkora helped us align engineering and product updates without the Slack chaos.”</p>
					<div className="mt-4"><StarRow /></div>
					<div className="mt-2 text-xs text-white/60">Henry Arthur<br />Head of Engineering, Loom</div>
				</div>
				<div>
					<div className="text-white/80 font-semibold mb-3">intercom</div>
					<p className="text-white/60 text-sm">“Game-changing platform for agile retros, visual sprints, and shared task views.”</p>
					<div className="mt-4"><StarRow /></div>
					<div className="mt-2 text-xs text-white/60">Jerome Bell<br />Product Analyst, Intercom</div>
				</div>
				<div>
					<div className="text-white/80 font-semibold mb-3">Abstract</div>
					<p className="text-white/60 text-sm">“The live whiteboard + AI chat combo is now core to our remote onboarding.”</p>
					<div className="mt-4"><StarRow /></div>
					<div className="mt-2 text-xs text-white/60">Eleanor Pena<br />Head of Product Design, Abstract</div>
				</div>
			</div>

			{/* Stats */}
			<div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
					<div className="text-5xl font-semibold text-white">{customers}+</div>
					<div className="mt-2 text-sm text-white/60">Happy customers</div>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
					<div className="text-5xl font-semibold text-white">{hours.toLocaleString()}+</div>
					<div className="mt-2 text-sm text-white/60">Hours spent on craft</div>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
					<div className="text-5xl font-semibold text-white">{(review / 10).toFixed(1)}</div>
					<div className="mt-2 text-sm text-white/60">Review rate</div>
				</div>
			</div>
		</div>
	);
};

export default function HowItWorks() {
	return (
		<section id="how-it-works" className="py-24">
			<div className="mx-auto w-full max-w-6xl px-6">
				<div className="text-center mb-16 opacity-100">
					<div className="inline-flex items-center px-4 py-2 bg-[#B8FF14]/15 border border-[#B8FF14]/30 rounded-full text-sm text-[#B8FF14] mb-6">
						<div className="w-2 h-2 rounded-full bg-[#B8FF14] mr-2" />
						How it works
					</div>
					<div className="text-4xl md:text-5xl font-bold mb-6 text-white justify-center">
						<BlurText
							text="Seamless teamwork, delivered in real time."
							delay={150}
							animateBy="words"
							direction="top"
							className="text-4xl md:text-5xl font-bold text-white justify-center"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
					{steps.map((step, index) => (
						<TiltCard key={step.title} index={index}>
							<div className="p-8 text-center [transform-style:preserve-3d]">
								<div
									className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(0,0,0,0))] border border-neutral-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] will-change-transform"
									style={{ transform: "translateZ(24px)" }}
								>
									<step.icon className={`w-8 h-8 ${step.color}`} />
								</div>
								<h3 className="text-xl font-semibold mb-3 text-white" style={{ transform: "translateZ(18px)" }}>
									{step.title}
								</h3>
								<p className="text-white/60 leading-relaxed" style={{ transform: "translateZ(12px)" }}>
									{step.description}
								</p>
							</div>
						</TiltCard>
					))}
				</div>

				<Testimonials />
			</div>
		</section>
	);
}


