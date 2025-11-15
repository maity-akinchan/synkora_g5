import { redirect } from "next/navigation";

import { Navigation } from "@/components/home/Navigation";
import Hero from "@/components/home/Hero";
import ShowcaseCards from "@/components/home/ShowcaseCards";
import Brands from "@/components/home/Brands";
import FeaturesIntro from "@/components/home/FeaturesIntro";
import BenefitsGrid from "@/components/home/BenefitsGrid";
import FeatureShowcase from "@/components/home/FeatureShowcase";
import Aurora from "@/components/home/Aurora";
import HowItWorks from "@/components/home/HowItWorks";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/home/Footer";
import BlurText from "@/components/home/BlurText";
import DarkVeil from "@/components/home/DarkVeil";

export default async function Home() {
	// Attempt to read the session without crashing if Prisma isn't generated yet.
	try {
		const { getServerSession } = await import("next-auth");
		const { authOptions } = await import("@/lib/auth");
		const session = await getServerSession(authOptions as any);
		if (session) {
			redirect("/dashboard");
		}
	} catch {
		// ignore auth/prisma readiness errors on marketing pages
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
			<Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} />

            <div className="relative z-10 flex min-h-screen flex-col">
                <Navigation />
				<Hero />
				<div className="mx-auto w-full max-w-6xl px-6">
					<ShowcaseCards />
					<Brands />
				</div>
			</div>

			<section
				id="features"
				className="relative mt-8 md:mt-[60px] border-t border-white/5 bg-gradient-to-b from-transparent via-white/5 to-transparent py-24"
			>
				<div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-40 max-w-4xl rounded-full bg-[#B8FF14]/10 blur-[120px]" />
				<div className="relative mx-auto w-full max-w-6xl px-6 md:px-10">
					<FeaturesIntro />
					<div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-2 text-center">
						<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B8FF14]">
							<span className="flex h-2 w-2 items-center justify-center rounded-full bg-[#B8FF14]" />
							<span>What you&apos;ll get</span>
						</div>
						<BlurText
							text="We resolve problems associated with disconnected workflow"
							delay={150}
							animateBy="words"
							direction="top"
							className="text-2xl font-semibold text-white md:text-4xl justify-center"
						/>
					</div>
					<div className="mt-12">
						<BenefitsGrid />
					</div>
					<FeatureShowcase />
				</div>
			</section>

			<div className="relative w-full">
				<div className="absolute inset-0 -z-10 w-full h-full">
					<DarkVeil />
				</div>
				<div className="relative z-10">
					<HowItWorks />
					<FAQ />
					<Footer />
				</div>
			</div>
		</main>
	);
}


