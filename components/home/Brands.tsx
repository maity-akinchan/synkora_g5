import LogoLoop from "./LogoLoop";

export default function Brands() {
	return (
		<div className="mt-16 w-full">
			<div className="relative mx-auto w-full max-w-6xl overflow-hidden">
				<LogoLoop
					ariaLabel="Trusted by teams"
					logos={[
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Headspace</span> },
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Shopify</span> },
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Volvo</span> },
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Mobbin</span> },
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Pinterest</span> },
						{ node: <span className="text-white/60 text-sm tracking-[0.35em] uppercase">Duolingo</span> },
					]}
					speed={90}
					direction="left"
					logoHeight={18}
					gap={56}
					hoverSpeed={0}
					scaleOnHover={false}
					fadeOut
					fadeOutColor="rgba(5,5,5,1)"
					className="py-3"
				/>
			</div>
		</div>
	);
}


