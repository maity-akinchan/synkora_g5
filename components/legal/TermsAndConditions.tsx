"use client";

import React, { useState, useEffect } from "react";
import {
	FileText,
	Shield,
	Users,
	CreditCard,
	AlertTriangle,
	Scale,
	Sun,
	Moon,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

interface SectionProps {
	id: string;
	title: string;
	icon: React.ElementType;
	children: React.ReactNode;
	isDark: boolean;
}

const Section: React.FC<SectionProps> = ({ id, title, icon: Icon, children, isDark }) => {
	return (
		<div
			id={id}
			className={`rounded-xl shadow-md border overflow-hidden scroll-mt-24 ${
				isDark
					? "bg-gray-900 border-gray-800"
					: "bg-white border-gray-100"
			}`}
		>
			<div
				className={`px-6 py-4 flex items-center space-x-3 border-b ${
					isDark
						? "border-gray-800 bg-gray-800/50"
						: "border-gray-200 bg-gray-50"
				}`}
			>
				<Icon className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-500"}`} />
				<h3
					className={`text-lg font-semibold ${
						isDark ? "text-gray-100" : "text-gray-800"
					}`}
				>
					{title}
				</h3>
			</div>
			<div
				className={`px-6 py-6 leading-relaxed space-y-4 ${
					isDark ? "text-gray-300" : "text-gray-700"
				}`}
			>
				{children}
			</div>
		</div>
	);
};

const TermsAndConditions = () => {
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const { theme, setTheme } = useTheme();
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const checkTheme = () => {
			const root = document.documentElement;
			const isDarkMode = root.classList.contains("dark");
			setIsDark(isDarkMode);
		};

		checkTheme();

		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, [theme]);

	const toggleTheme = () => {
		const newTheme = isDark ? "light" : "dark";
		setTheme(newTheme);
	};

	const sections = [
		{ id: "overview", title: "Agreement Overview", icon: FileText },
		{ id: "service", title: "Service Terms & Permitted Use", icon: Users },
		{ id: "restrictions", title: "Usage Restrictions", icon: AlertTriangle },
		{ id: "data", title: "Customer Data & Privacy", icon: Shield },
		{ id: "billing", title: "Subscription & Billing", icon: CreditCard },
		{ id: "legal", title: "Legal Terms & Liability", icon: Scale },
		{
			id: "modifications",
			title: "Modifications & Governing Law",
			icon: FileText,
		},
	];

	const handleScrollTo = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			const yOffset = -20;
			const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
			window.scrollTo({ top: y, behavior: "smooth" });
		}
	};

	return (
		<div
			className={`min-h-screen transition-colors duration-300 ${
				isDark ? "bg-[#0a0a0a]" : "bg-[#F5F7FF]"
			}`}
		>
			{/* Theme Toggle Button */}
			<div className="fixed top-24 right-6 z-[9998]">
				<Button
					onClick={toggleTheme}
					variant="outline"
					size="icon"
					className={`rounded-full ${
						isDark
							? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
							: "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
					}`}
				>
					{isDark ? (
						<Sun className="h-5 w-5" />
					) : (
						<Moon className="h-5 w-5" />
					)}
				</Button>
			</div>

			{/* Header */}
			<div
  className={`
    py-16 text-white relative overflow-hidden transition-colors duration-500
    ${isDark
      ? "bg-gradient-to-br from-green-900 via-green-700 to-green-500"
      : "bg-gradient-to-br from-green-700 via-green-500 to-green-400"
    }
  `}
>
  {/* Soft glossy overlay for readability */}
  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none"></div>

  <div className="relative max-w-6xl mx-auto px-6 text-center z-10">
    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
      Terms of Service
    </h1>

    <p className="text-xl opacity-95 font-medium tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
      Synkora
    </p>

    <div className="mt-6 space-y-2 text-sm opacity-90">
      <p className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
        Publication Date: August 19, 2025
      </p>
      <p className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
        Effective Date: September 1, 2025
      </p>
    </div>
  </div>
</div>


			{/* Content Layout */}
			<div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row gap-8">
				{/* Table of Contents (hidden on mobile) */}
				<div
					className={`hidden sm:block w-full sm:w-1/4 sticky top-24 h-fit rounded-lg border shadow-md p-6 ${
						isDark
							? "bg-gray-900 border-gray-800"
							: "bg-white border-gray-200"
					}`}
				>
					<h2
						className={`text-lg font-bold mb-4 border-b pb-2 ${
							isDark
								? "border-gray-800 text-gray-100"
								: "border-gray-200 text-gray-800"
						}`}
					>
						Table of Contents
					</h2>
					<ul className="space-y-2 text-sm mt-3">
						{sections.map((section) => (
							<li key={section.id}>
								<button
									onClick={() => handleScrollTo(section.id)}
									className={`text-left w-full transition-colors ${
										isDark
											? "text-gray-400 hover:text-green-400"
											: "text-gray-600 hover:text-green-600"
									}`}
								>
									{section.title}
								</button>
							</li>
						))}
					</ul>
				</div>

				{/* Terms Sections */}
				<div className="w-full sm:w-3/4 space-y-10">
					<Section
						id="overview"
						title="Agreement Overview"
						icon={FileText}
						isDark={isDark}
					>
						<p className="mb-2">
							This Synkora Terms of Service ("Agreement") is entered into by
							and between Synkora Technologies or its affiliate identified in an
							Order ("Synkora") and the entity or person placing an order for or
							accessing the Service ("Customer" or "you").
						</p>
						<p className="mb-2">
							By accepting this Agreement, or by accessing or using the Service,
							you agree to be legally bound by these Terms. Please read them
							carefully.
						</p>
						<p>
							This Agreement governs your use of all Synkora services, software,
							and documentation provided under your subscription plan. If you do
							not agree to these terms, you must not use the Service.
						</p>
					</Section>

					<Section
						id="service"
						title="Service Terms & Permitted Use"
						icon={Users}
						isDark={isDark}
					>
						<p>
							During your subscription term, you may access and use Synkora
							services solely for your internal business or personal purposes. You
							may not resell or distribute the service without prior written
							consent from Synkora.
						</p>
						<p>
							Users are responsible for maintaining the confidentiality of their
							account credentials and ensuring compliance with applicable laws
							while using the Service.
						</p>
						<p>
							Synkora may provide updates, upgrades, or additional features from
							time to time. Your continued use of the Service constitutes
							acceptance of these updates.
						</p>
					</Section>

					<Section
						id="restrictions"
						title="Usage Restrictions"
						icon={AlertTriangle}
						isDark={isDark}
					>
						<p>
							You may not use the Service to engage in any activity that violates
							applicable laws or regulations, or that could harm Synkora or any
							third party.
						</p>
						<p>Prohibited uses include, but are not limited to:</p>
						<ul className="list-disc list-inside space-y-1">
							<li>Reverse engineering or copying the Service</li>
							<li>Sharing your account credentials with unauthorized users</li>
							<li>Transmitting harmful, abusive, or illegal content</li>
							<li>Attempting to bypass security measures or restrictions</li>
						</ul>
					</Section>

					<Section
						id="data"
						title="Customer Data & Privacy"
						icon={Shield}
						isDark={isDark}
					>
						<p>
							Synkora respects your privacy and will handle your data according to
							our Privacy Policy.
						</p>
						<p>
							You retain ownership of all data you upload or input into the
							Service. Synkora may use aggregated and anonymized data for
							analytics and service improvements.
						</p>
						<p>
							Customers are responsible for ensuring that their use of the
							Service complies with applicable data protection laws.
						</p>
					</Section>

					<Section
						id="billing"
						title="Subscription & Billing"
						icon={CreditCard}
						isDark={isDark}
					>
						<p>
							All subscriptions are billed in advance according to the selected
							plan. Fees are non-refundable except as required by law or stated in
							this Agreement.
						</p>
						<p>
							Synkora reserves the right to adjust pricing, billing cycles, and
							available plans upon providing notice. Payment must be made using
							accepted payment methods.
						</p>
						<p>
							Failure to pay may result in suspension or termination of your
							account and access to the Service.
						</p>
					</Section>

					<Section
						id="legal"
						title="Legal Terms & Liability"
						icon={Scale}
						isDark={isDark}
					>
						<p>
							Synkora provides the Service "as is" and disclaims all warranties to
							the fullest extent permitted by law. Synkora shall not be liable for
							indirect, incidental, or consequential damages arising from the use
							of the Service.
						</p>
						<p>
							Customers agree to indemnify and hold harmless Synkora against claims
							arising from violation of this Agreement or misuse of the Service.
						</p>
					</Section>

					<Section
						id="modifications"
						title="Modifications & Governing Law"
						icon={FileText}
						isDark={isDark}
					>
						<p>
							Synkora may modify the Terms of Service from time to time. Users will
							be notified of significant changes. Continued use after
							modifications constitutes acceptance.
						</p>
						<p>
							This Agreement is governed by the laws of the jurisdiction in which
							Synkora operates, without regard to conflicts of law principles.
							Disputes shall be resolved in the courts of that jurisdiction.
						</p>
					</Section>
				</div>
			</div>

			{/* Acceptance Section */}
			<div className="max-w-4xl mx-auto px-6 py-12">
				<div
					className={`rounded-xl shadow-md border p-6 ${
						isDark
							? "bg-gray-900 border-gray-800"
							: "bg-white border-gray-100"
					}`}
				>
					<h3
						className={`text-xl font-bold mb-4 ${
							isDark ? "text-gray-100" : "text-gray-800"
						}`}
					>
						Agreement Acceptance
					</h3>
					<div className="flex items-start space-x-3 mb-6">
						<input
							type="checkbox"
							id="accept-terms"
							checked={acceptedTerms}
							onChange={(e) => setAcceptedTerms(e.target.checked)}
							className={`mt-1 w-4 h-4 rounded focus:ring-2 ${
								isDark
									? "text-green-400 focus:ring-green-500"
									: "text-green-600 focus:ring-green-500"
							}`}
						/>
						<label
							htmlFor="accept-terms"
							className={`leading-relaxed ${
								isDark ? "text-gray-300" : "text-gray-600"
							}`}
						>
							I have read, understood, and agree to be bound by these Terms of
							Service. I acknowledge that this Agreement will govern my use of
							Synkora&apos;s services.
						</label>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<button
							disabled={!acceptedTerms}
							className={`px-6 py-3 rounded-lg font-semibold transition-all ${
								acceptedTerms
									? "bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 shadow-lg hover:shadow-xl"
									: isDark
										? "bg-gray-800 text-gray-500 cursor-not-allowed"
										: "bg-gray-200 text-gray-400 cursor-not-allowed"
							}`}
						>
							Accept Terms & Continue
						</button>
						<button
							className={`px-6 py-3 border-2 rounded-lg font-semibold transition-colors ${
								isDark
									? "border-gray-700 text-gray-300 hover:border-gray-600 hover:text-gray-200"
									: "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
							}`}
						>
							Decline
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TermsAndConditions;

