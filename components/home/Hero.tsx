"use client";

import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Aurora from "@/components/home/Aurora";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import BlurText from "@/components/home/BlurText";

export default function Hero() {
	return (
		<>
			{/* Include Google Font */}
			<Head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap"
					rel="stylesheet"
				/>
			</Head>

			<section className="relative w-full mb-[30px]" style={{ fontFamily: '"Merriweather", serif' }}>
				{/* Background Aurora */}
				<div className="absolute inset-0 -z-10 pointer-events-none">
					<Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} />
				</div>

				<ContainerScroll
					titleComponent={
						<>
							{/* <div className="pointer-events-none absolute -left-10 top-20 hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 shadow-lg md:flex items-center gap-2">
								<span className="cursor-dot cursor-pink" />
								Nova
							</div>
							<div className="pointer-events-none absolute -right-12 top-32 hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 shadow-lg md:flex items-center gap-2">
								<span className="cursor-dot cursor-blue" />
								Aether
							</div> */}
							<br />
							<br />
							<br />
							<br />
							<div className="mx-auto max-w-4xl text-center text-4xl font-semibold leading-[1.08] text-white md:text-6xl lg:text-7xl">
								<BlurText
									text="Your team's visual command center.With AI."
									delay={150}
									animateBy="words"
									direction="top"
									className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] text-white justify-center"
								/>
							</div>
							<div className="mt-16 flex items-center justify-center gap-4">
								<Button variant="outline" className="h-12 rounded-full px-8 text-sm tracking-wide bg-neutral-900/60 border-neutral-800 text-white hover:border-neutral-700">
									<Link href="/login">LOGIN</Link>
								</Button>
								<Button
									size="lg"
									className="h-12 rounded-full px-8 text-sm font-semibold text-black bg-lime-300 hover:bg-lime-200 transition-transform will-change-transform hover:scale-[1.03] shadow-[0_0_0_6px_rgba(180,255,20,0.16),0_0_50px_rgba(180,255,20,0.3)]"
								>
									<Link href="/signup">Sign up</Link>
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</div>
							<p className="mx-auto mt-6 max-w-2xl text-base text-white/60 md:text-lg">
								Task management, live dashboards, and whiteboard collaboration in one powerful workspace.
							</p>
							{/* CTAs */}
							
						</>
					}
				>
					<Image
						src="/images/kanban-hero.png"
						alt="Synkora Kanban Board"
						height={720}
						width={1400}
						className="mx-auto h-full rounded-2xl object-cover object-left-top"
						draggable={false}
						priority
					/>
				</ContainerScroll>
			</section>
		</>
	);
}
