import type { JSX } from "react";

export default function GeistDarkThemePage(): JSX.Element {
	return (
		<div className="container mx-auto p-8 space-y-12">
			<div className="space-y-4">
				<h1 className="text-heading-48">Geist Dark Theme</h1>
				<p className="text-copy-16 text-secondary">
					Kompletna Vercel Geist Design System dark tema sa svim bojama i
					skalama.
				</p>
			</div>

			{/* Backgrounds */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Backgrounds</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-background-1, #000000)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Background 1</h3>
						<p className="text-copy-14 text-secondary">
							Default element background
						</p>
						<code className="text-copy-12 text-secondary">#000000</code>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-background-2, #111111)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Background 2</h3>
						<p className="text-copy-14 text-secondary">Secondary background</p>
						<code className="text-copy-12 text-secondary">#111111</code>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-component-default, #111111)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Component Default</h3>
						<p className="text-copy-14 text-secondary">Color 1 (default)</p>
						<code className="text-copy-12 text-secondary">#111111</code>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-component-hover, #1A1A1A)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Component Hover</h3>
						<p className="text-copy-14 text-secondary">Color 2 (hover)</p>
						<code className="text-copy-12 text-secondary">#1A1A1A</code>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-component-active, #262626)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Component Active</h3>
						<p className="text-copy-14 text-secondary">Color 3 (active)</p>
						<code className="text-copy-12 text-secondary">#262626</code>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor:
								"var(--geist-dark-high-contrast-default, #525252)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">High Contrast Default</h3>
						<p className="text-copy-14 text-secondary">Color 7 (default)</p>
						<code className="text-copy-12 text-secondary">#525252</code>
					</div>
				</div>
			</section>

			{/* Borders */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Borders</h2>
				<div className="space-y-4">
					<div
						className="p-6 rounded-lg border-2"
						style={{
							backgroundColor: "var(--geist-dark-background-2, #111111)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Border Default</h3>
						<p className="text-copy-14 text-secondary">Color 4 (default)</p>
						<code className="text-copy-12 text-secondary">#2A2A2A</code>
					</div>
					<div
						className="p-6 rounded-lg border-2 transition-colors hover:border-[var(--geist-dark-border-hover)]"
						style={{
							backgroundColor: "var(--geist-dark-background-2, #111111)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Border Hover</h3>
						<p className="text-copy-14 text-secondary">
							Color 5 (hover) - Hover me
						</p>
						<code className="text-copy-12 text-secondary">#404040</code>
					</div>
					<div
						className="p-6 rounded-lg border-2"
						style={{
							backgroundColor: "var(--geist-dark-background-2, #111111)",
							borderColor: "var(--geist-dark-border-active, #525252)",
							color: "var(--geist-dark-text-primary, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Border Active</h3>
						<p className="text-copy-14 text-secondary">Color 6 (active)</p>
						<code className="text-copy-12 text-secondary">#525252</code>
					</div>
				</div>
			</section>

			{/* Text & Icons */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Text & Icons</h2>
				<div
					className="space-y-4 p-6 rounded-lg border"
					style={{
						backgroundColor: "var(--geist-dark-background-1, #000000)",
						borderColor: "var(--geist-dark-border-default, #2A2A2A)",
					}}
				>
					<p
						className="text-copy-16"
						style={{ color: "var(--geist-dark-text-primary, #FFFFFF)" }}
					>
						Primary Text (Color 10) - #FFFFFF
					</p>
					<p
						className="text-copy-16"
						style={{ color: "var(--geist-dark-text-secondary, #888888)" }}
					>
						Secondary Text (Color 9) - #888888
					</p>
					<div className="flex gap-4 items-center">
						<span
							className="text-label-16"
							style={{ color: "var(--geist-dark-icon-primary, #FFFFFF)" }}
						>
							Primary Icon
						</span>
						<span
							className="text-label-16"
							style={{ color: "var(--geist-dark-icon-secondary, #888888)" }}
						>
							Secondary Icon
						</span>
					</div>
				</div>
			</section>

			{/* Color Scales */}
			<section className="space-y-6">
				<h2 className="text-heading-24">Color Scales</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Gray Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Gray Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-gray-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 6
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #FFFFFF)",
									}}
								>
									<span className="text-label-14">gray-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Blue Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Blue Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-blue-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 5
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #FFFFFF)",
									}}
								>
									<span className="text-label-14">blue-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Red Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Red Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-red-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #FFFFFF)",
									}}
								>
									<span className="text-label-14">red-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Amber Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Amber Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-amber-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #000000)",
									}}
								>
									<span className="text-label-14">amber-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Green Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Green Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-green-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #000000)",
									}}
								>
									<span className="text-label-14">green-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Teal Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Teal Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-teal-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #000000)",
									}}
								>
									<span className="text-label-14">teal-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Purple Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Purple Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-purple-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #000000)",
									}}
								>
									<span className="text-label-14">purple-{num}</span>
								</div>
							))}
						</div>
					</div>

					{/* Pink Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Pink Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div
									key={num}
									className="flex items-center gap-2 p-2 rounded border"
									style={{
										backgroundColor: `var(--geist-dark-pink-${num})`,
										borderColor: "var(--geist-dark-border-default, #2A2A2A)",
										color:
											num <= 4
												? "var(--geist-dark-text-primary, #FFFFFF)"
												: "var(--geist-dark-text-primary, #000000)",
									}}
								>
									<span className="text-label-14">pink-{num}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Gray Alpha Scale */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Gray Alpha Scale</h2>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
						<div
							key={num}
							className="p-6 rounded-lg border relative overflow-hidden"
							style={{
								backgroundColor: "var(--geist-dark-background-1, #000000)",
								borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							}}
						>
							<div
								className="absolute inset-0"
								style={{
									backgroundColor: `var(--geist-dark-gray-alpha-${num})`,
								}}
							/>
							<div className="relative z-10">
								<h3 className="text-label-14 mb-1 text-primary">Alpha {num}</h3>
								<p className="text-copy-12 text-secondary">
									{num * 10}% opacity
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Semantic Colors */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Semantic Colors</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-primary, #0070F3)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-primary-foreground, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Primary</h3>
						<p className="text-copy-14">#0070F3</p>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-secondary, #262626)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-secondary-foreground, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Secondary</h3>
						<p className="text-copy-14">#262626</p>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-destructive, #FF3B3B)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-destructive-foreground, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Destructive</h3>
						<p className="text-copy-14">#FF3B3B</p>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-success, #00B37E)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-success-foreground, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Success</h3>
						<p className="text-copy-14">#00B37E</p>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-warning, #FFB300)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-warning-foreground, #000000)",
						}}
					>
						<h3 className="text-label-16 mb-2">Warning</h3>
						<p className="text-copy-14">#FFB300</p>
					</div>
					<div
						className="p-6 rounded-lg border"
						style={{
							backgroundColor: "var(--geist-dark-error, #FF3B3B)",
							borderColor: "var(--geist-dark-border-default, #2A2A2A)",
							color: "var(--geist-dark-error-foreground, #FFFFFF)",
						}}
					>
						<h3 className="text-label-16 mb-2">Error</h3>
						<p className="text-copy-14">#FF3B3B</p>
					</div>
				</div>
			</section>

			{/* Usage Example */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Usage Example</h2>
				<div
					className="space-y-4 p-6 rounded-lg border"
					style={{
						backgroundColor: "var(--geist-dark-background-1, #000000)",
						borderColor: "var(--geist-dark-border-default, #2A2A2A)",
					}}
				>
					<h1
						className="text-heading-72"
						style={{ color: "var(--geist-dark-text-primary, #FFFFFF)" }}
					>
						Dark Theme Hero
					</h1>
					<p
						className="text-copy-16"
						style={{ color: "var(--geist-dark-text-secondary, #888888)" }}
					>
						Geist dark theme design language applied to your application.
					</p>
					<div className="flex gap-4 mt-4">
						<button
							className="text-button-14 px-6 py-3 rounded-md text-white hover:opacity-90 transition-opacity"
							style={{
								backgroundColor: "var(--geist-dark-primary, #0070F3)",
							}}
						>
							Primary Action
						</button>
						<button
							className="text-button-14 px-4 py-2 rounded-md border transition-colors"
							style={{
								borderColor: "var(--geist-dark-border-default, #2A2A2A)",
								color: "var(--geist-dark-text-primary, #FFFFFF)",
								backgroundColor: "var(--geist-dark-background-2, #111111)",
							}}
						>
							Secondary Action
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
