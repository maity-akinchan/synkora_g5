import Link from "next/link";

export default function SiteHeader() {
	return (
		<header className="mx-auto w-full max-w-6xl px-6 pt-8 md:px-10">
			<nav className="flex items-center justify-between rounded-full border border-white/5 bg-white/5 px-6 py-3 backdrop-blur-md">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-black">
						<span className="text-base font-semibold">S</span>
					</div>
					<span className="text-sm font-medium tracking-[0.2em] text-white/80">
						SYNKORA
					</span>
				</div>

				<div className="hidden items-center gap-6 text-sm text-white/60 md:flex">
					<a href="#features" className="transition hover:text-white">
						Features
					</a>
					<a href="#how-it-works" className="transition hover:text-white">
						How it works
					</a>
					<a href="#testimonials" className="transition hover:text-white">
						Testimonials
					</a>
					<a href="#faqs" className="transition hover:text-white">
						FAQs
					</a>
				</div>

				<Link
					href="/register"
					className="rounded-full bg-[#B8FF14] px-5 py-2 text-sm font-semibold text-black transition hover:bg-lime-200"
				>
					Notify me
				</Link>
			</nav>
		</header>
	);
}


