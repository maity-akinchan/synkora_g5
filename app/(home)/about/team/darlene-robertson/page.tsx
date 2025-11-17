import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Darlene Robertson - Engineer | Synkora",
	description: "Meet Darlene Robertson, Engineer at Synkora, building the future of collaborative workspaces.",
};

export default function DarleneRobertsonPage() {
	return (
		<main className="min-h-screen bg-background text-foreground py-20 px-8">
			<div className="max-w-4xl mx-auto">
				<Link href="/about" className="text-muted-foreground hover:text-foreground mb-8 inline-block">
					← Back to About
				</Link>
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div className="relative">
						<Image
							src="/images/team/darlene-robertson.jpg"
							alt="Darlene Robertson"
							width={400}
							height={400}
							className="rounded-2xl"
						/>
					</div>
					<div>
						<h1 className="text-4xl font-bold mb-4">Darlene Robertson</h1>
						<p className="text-xl text-muted-foreground mb-6">Engineer</p>
						<p className="text-lg leading-relaxed">
							Building the future of collaborative workspaces. Darlene is passionate about creating
							scalable, performant solutions that enable teams to collaborate seamlessly in real-time.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}

