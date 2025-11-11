"use client";

import { useEffect, useRef } from "react";

export default function BenefitsGrid() {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = rootRef.current;
		if (!node) return;
		const revealEls = Array.from(node.querySelectorAll<HTMLElement>(".reveal-on-scroll"));

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("in-view");
					}
				});
			},
			{ threshold: 0.15 }
		);

		revealEls.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, []);

	return (
		<div ref={rootRef} className="grid gap-6 md:grid-cols-3">
			<div className="reveal-on-scroll relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
				<div className="text-sm font-semibold text-[#B8FF14]">Growth</div>
				<div className="relative h-28 rounded-2xl border border-white/10 bg-black/70 overflow-hidden">
					<div className="absolute inset-x-8 bottom-4 flex items-end justify-between gap-3">
						{Array.from({ length: 10 }).map((_, index) => (
							<div
								key={index}
								className="w-2 rounded-full bg-gradient-to-t from-[#B8FF14]/20 to-[#B8FF14] animate-bar"
								style={{
									height: `${32 + (index % 5) * 10}px`,
									animationDelay: `${index * 140}ms`,
								}}
							/>
						))}
					</div>
					<div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#B8FF14] animate-neon-flicker" />
				</div>
				<div>
					<h4 className="text-lg font-semibold text-white">Unified workspace</h4>
					<p className="mt-3 text-sm text-white/60">
						Replace six tools with one. Keep tasks, chats, docs, and whiteboards in sync.
					</p>
				</div>
			</div>

			<div className="reveal-on-scroll relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
				<div className="flex items-center gap-2 text-sm font-semibold text-[#B8FF14]">
					<span className="rounded-full bg-[#B8FF14] px-2 py-1 text-[11px] font-semibold text-black">
						New
					</span>
					Custom views
				</div>
				{/* Stacked cards and floating badge to match design */}
				<div className="relative h-48 rounded-3xl bg-transparent">
					<div className="absolute left-4 right-4 top-2 h-24 rounded-2xl border border-white/10 bg-white/5" />
					<div className="absolute left-8 right-8 top-6 h-24 rounded-2xl border border-white/10 bg-white/5" />

					{/* Foreground pill card */}
					<div className="absolute -top-2 left-1/2 w-[88%] -translate-x-1/2 rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl">
						<div className="flex items-center gap-3">
							<div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5">
								<span className="text-[#B8FF14]">⚡</span>
							</div>
							<div className="flex-1">
								<div className="text-sm font-semibold text-white">Custom Views</div>
								<div className="text-[11px] text-white/50">Today, 11:50</div>
							</div>
							<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#B8FF14]">
								<span className="h-2 w-2 rounded-full bg-[#B8FF14]" /> New
							</div>
						</div>
					</div>

					{/* Dotted guide lines */}
					<div className="absolute bottom-6 left-10 right-10 space-y-3 opacity-60">
						<div className="h-[3px] rounded bg-[repeating-linear-gradient(90deg,rgba(184,255,20,0.65)_0_12px,transparent_12px_22px)]" />
						<div className="h-[3px] w-[80%] rounded bg-[repeating-linear-gradient(90deg,rgba(184,255,20,0.4)_0_12px,transparent_12px_22px)]" />
					</div>
				</div>
				<div>
					<h4 className="text-lg font-semibold text-white">Custom views</h4>
					<p className="mt-3 text-sm text-white/60">
						Switch between kanban, mind maps, or data views — your workspace, your way.
					</p>
				</div>
			</div>

			<div className="reveal-on-scroll relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
				<div className="text-sm font-semibold text-[#B8FF14]">Scale</div>
				<div className="relative h-28 rounded-2xl border border-white/10 bg-black/70 overflow-hidden">
					<div className="absolute inset-6">
						<div className="h-full w-full rounded-full border border-dashed border-white/10" />
						<div className="absolute bottom-4 left-6 right-6 h-1 rounded-full bg-[#B8FF14]/20" />
						<div className="absolute bottom-4 left-6 h-3 w-3 rounded-full bg-[#B8FF14] animate-travel" />
					</div>
				</div>
				<div>
					<h4 className="text-lg font-semibold text-white">Scales with your team</h4>
					<p className="mt-3 text-sm text-white/60">
						From solo founders to entire organizations — Synkora adapts as you grow.
					</p>
				</div>
			</div>
		</div>
	);
}


