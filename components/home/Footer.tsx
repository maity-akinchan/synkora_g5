"use client";

import Image from "next/image";
import { Twitter, Linkedin, Github } from "lucide-react";
import GlassIcons from "./GlassIcons";

export default function Footer() {
	const socialItems = [
		{ icon: <Twitter className="w-6 h-6 text-white" />, color: "blue", label: "Twitter" },
		{ icon: <Linkedin className="w-6 h-6 text-white" />, color: "indigo", label: "LinkedIn" },
		{ icon: <Github className="w-6 h-6 text-white" />, color: "purple", label: "GitHub" },
	];

	return (
		<footer className="bg-white/5 border-t border-white/10 py-16">
			<div className="container mx-auto px-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
					{/* Logo and Description */}
					<div className="md:col-span-2">
						<div className="flex items-center mb-4">
							<Image src="/images/logo.png" alt="Synkora" width={32} height={32} className="w-8 h-8" />
						</div>
						<p className="text-white/60 mb-6 max-w-md">
							Your team&apos;s visual command center. Task management, live dashboards, and whiteboard collaboration in one powerful workspace.
						</p>
						<div className="flex space-x-4">
							<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
								Twitter
							</a>
							<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
								LinkedIn
							</a>
							<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
								GitHub
							</a>
						</div>
					</div>

					{/* Product */}
					<div>
						<h3 className="font-semibold text-white mb-4">Product</h3>
						<ul className="space-y-2">
							<li>
								<a href="#features" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Features
								</a>
							</li>
							<li>
								<a href="#how-it-works" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									How it works
								</a>
							</li>
							<li>
								<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Pricing
								</a>
							</li>
							<li>
								<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Security
								</a>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="font-semibold text-white mb-4">Company</h3>
						<ul className="space-y-2">
							<li>
								<a href="/about" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									About
								</a>
							</li>
							<li>
								<a href="/blog" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Blog
								</a>
							</li>
							<li>
								<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Careers
								</a>
							</li>
							<li>
								<a href="#" className="text-white/60 hover:text-[#B8FF14] transition-colors">
									Contact
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Glass Icons */}
				<div className="mb-12">
					<GlassIcons items={socialItems} className="custom-class" />
				</div>

				{/* Bottom */}
				<div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
					<p className="text-white/60">© 2024 Synkora. All rights reserved.</p>
					<div className="flex space-x-6 mt-4 md:mt-0">
						<a href="/privacy" className="text-white/60 hover:text-[#B8FF14] transition-colors text-sm">
							Privacy Policy
						</a>
						<a href="/terms" className="text-white/60 hover:text-[#B8FF14] transition-colors text-sm">
							Terms of Service
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

