export default function FeatureShowcase() {
	return (
		<div className="mt-8 grid gap-6 md:grid-cols-2">
			{/* All under one roof */}
			<div className="relative rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0))] p-8">
				<h3 className="text-xl font-semibold text-white">All under one roof</h3>
				<p className="mt-2 text-sm text-white/60">
					Can work like Notion, Slack, Figma, Sheets & more.
				</p>

				{/* Logo rows */}
				<div className="mt-6 flex flex-wrap items-center gap-3">
					{[
						{ txt: "F", bg: "from-purple-500 to-pink-500", border: "border-fuchsia-400" },
						{ txt: "N", bg: "from-white to-white", border: "border-white", text: "text-black" },
						{ txt: "*", bg: "from-purple-600 to-pink-600", border: "border-fuchsia-500" },
						{ txt: "X", bg: "from-black to-black", border: "border-white/20" },
						{ txt: "⚙", bg: "from-orange-500 to-orange-500", border: "border-orange-400" },
						{ txt: "A", bg: "from-blue-500 to-cyan-500", border: "border-blue-400" },
					].map((l, i) => (
						<div
							key={i}
							className={`h-12 w-12 rounded-full border ${l.border} bg-gradient-to-br ${l.bg} grid place-items-center text-white ${l.text ?? ""} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
						>
							<span className="text-sm font-semibold">{l.txt}</span>
						</div>
					))}
				</div>
			</div>

			{/* Collaborate real-time */}
			<div className="relative rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0))] p-8">
				<h3 className="text-xl font-semibold text-white">Collaborate real-time</h3>
				<p className="mt-2 text-sm text-white/60">
					Chat, co-edit, brainstorm — all in the same tab.
				</p>

				<div className="mt-6 flex items-center gap-3">
					<div className="relative">
						<div className="h-10 w-10 -ml-0 rounded-full border-2 border-fuchsia-400 bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center text-white text-sm font-medium">
							S
						</div>
					</div>
					<div className="relative -ml-3">
						<div className="h-10 w-10 rounded-full border-2 border-blue-400 bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center text-white text-sm font-medium">
							M
						</div>
					</div>
					<div className="relative -ml-3">
						<div className="h-10 w-10 rounded-full border-2 border-lime-400 bg-gradient-to-br from-lime-400 to-green-500 grid place-items-center text-white text-sm font-medium">
							E
						</div>
						<div className="absolute -right-5 top-1/2 -translate-y-1/2 rounded-full bg-[#B8FF14] px-2 py-0.5 text-[10px] font-semibold text-black shadow-[0_0_10px_rgba(184,255,20,0.7)]">
							Elia
						</div>
					</div>
					<div className="relative -ml-3">
						<div className="h-10 w-10 rounded-full border-2 border-white/20 bg-neutral-800 grid place-items-center text-white/70 text-sm font-medium">
							+
						</div>
					</div>
				</div>
			</div>

			{/* Feature badges rows */}
			<div className="md:col-span-2 mt-2 flex flex-wrap justify-center gap-3">
				{[
					"Team whiteboard",
					"Live session",
					"Data insights",
					"Resource Hub",
					"TimeLine Tracking",
					"Advance role",
					"Global ready",
				].map((text, i) => (
					<div
						key={i}
						className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80"
					>
						<span className="inline-block h-2 w-2 rounded-full bg-[#B8FF14] shadow-[0_0_8px_rgba(184,255,20,0.6)]" />
						{text}
					</div>
				))}
			</div>
		</div>
	);
}


