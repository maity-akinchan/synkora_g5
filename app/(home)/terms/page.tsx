import type { Metadata } from "next";
import { Navigation } from "@/components/home/Navigation";
import Footer from "@/components/home/Footer";
import TermsAndConditions from "@/components/legal/TermsAndConditions";

export const metadata: Metadata = {
	title: "Terms of Service | Synkora",
	description: "Read Synkora's Terms of Service and understand the agreement governing your use of our platform.",
};

export default function TermsPage() {
	return (
		<main className="relative min-h-screen overflow-hidden bg-background text-foreground">
			<Navigation />
			<div className="relative z-10 flex min-h-screen flex-col pt-24">
				<TermsAndConditions />
				<Footer />
			</div>
		</main>
	);
}

