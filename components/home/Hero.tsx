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

  {/* LOGIN BUTTON */}
  <div className="relative group p-[3px] rounded-[0.9em] transition-all duration-[400ms] ease-in-out">
    <div className="absolute inset-0 bg-gradient-to-r from-[#84cc16] to-[#22c55e] rounded-[0.9em] opacity-0 group-hover:opacity-100 blur-[1.2em] transition-all duration-[400ms] ease-in-out group-active:blur-[0.2em] -z-10" />
    <Button
      variant="outline"
      className="
        relative
        h-12 rounded-[0.5em] px-8 text-sm tracking-wide
        bg-black text-white border-none
        shadow-[2px_2px_3px_rgba(0,0,0,0.71)]
        hover:shadow-[2px_2px_3px_rgba(0,0,0,0.71)]
        transition-all duration-200
        cursor-pointer
      "
    >
      <Link href="/login" className="pointer-events-auto">LOGIN</Link>
    </Button>
  </div>

  {/* SIGN UP BUTTON */}
  <Button
    size="lg"
    className="
      group
      relative
      h-12 rounded-full px-5 py-2.5 text-sm font-bold text-black
      bg-[#cfef00] hover:bg-[#c4e201]
      border border-transparent
      flex items-center gap-2.5
      transition-all duration-200
      cursor-pointer
      active:scale-95
    "
  >
    <Link href="/register" className="pointer-events-auto flex items-center gap-2.5">
      <span>Sign up</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 74 74" 
        height={34} 
        width={34}
        className="w-[34px] h-[34px] ml-2.5 transition-transform duration-300 ease-in-out group-hover:translate-x-[5px]"
      >
        <circle strokeWidth={3} stroke="black" r="35.5" cy={37} cx={37} />
        <path fill="black" d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z" />
      </svg>
    </Link>
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
