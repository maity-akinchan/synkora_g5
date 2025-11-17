import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Cameron Williamson - Designer | Synkora",
	description: "Meet Cameron Williamson, Designer at Synkora, crafting intuitive experiences for modern teams.",
};

export default function CameronWilliamsonPage() {
	return (
		<main className="min-h-screen bg-background text-foreground py-20 px-8">
			<div className="max-w-4xl mx-auto">
				<Link href="/about" className="text-muted-foreground hover:text-foreground mb-8 inline-block">
					← Back to About
				</Link>
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div className="relative">
						<Image
							src="/images/team/cameron-williamson.jpg"
							alt="Cameron Williamson"
							width={400}
							height={400}
							className="rounded-2xl"
						/>
					</div>
					<div>
						<h1 className="text-4xl font-bold mb-4">Cameron Williamson</h1>
						<p className="text-xl text-muted-foreground mb-6">Designer</p>
						<p className="text-lg leading-relaxed">
							Crafting intuitive experiences for modern teams. Cameron focuses on creating beautiful,
							user-friendly interfaces that make complex workflows feel simple and enjoyable.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}

