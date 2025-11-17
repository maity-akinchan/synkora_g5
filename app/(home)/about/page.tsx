import type { Metadata } from "next";
import { Navigation } from "@/components/home/Navigation";
import Footer from "@/components/home/Footer";
import AboutContent from "@/components/about/AboutContent";

export const metadata: Metadata = {
	title: "About Synkora | AI Automation for the Future",
	description: "Learn about Synkora — your AI automation partner helping businesses scale smarter, faster, and more efficiently.",
};

export default function About() {
	return (
		<main className="relative min-h-screen overflow-hidden bg-background text-foreground">
			<Navigation />
			<div className="relative z-10 flex min-h-screen flex-col">
				<AboutContent />
				<Footer />
			</div>
		</main>
	);
}

