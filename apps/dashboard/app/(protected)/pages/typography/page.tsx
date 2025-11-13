export default function TypographyPage() {
	return (
		<div className="container mx-auto p-8 space-y-12">
			<div className="space-y-4">
				<h1 className="text-heading-72">Geist Typography</h1>
				<p className="text-copy-16" style={{
					color: "var(--muted-foreground)",
				}}>
					Kompletna Geist tipografija i boje integrisane u Vercel temu.{" "}
					<strong>Geist design language</strong> primenjen na light theme.
				</p>
			</div>

			{/* Geist Colors */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Geist Colors</h2>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{/* Blue Colors */}
					<div className="space-y-2">
						<h3 className="text-label-14 font-semibold">Blue</h3>
						<div className="space-y-1">
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-blue-1, #F5F9FF)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-blue-6, #0070F3)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-blue-10, #001C55)" }}
							/>
						</div>
					</div>
					{/* Gray Colors */}
					<div className="space-y-2">
						<h3 className="text-label-14 font-semibold">Gray</h3>
						<div className="space-y-1">
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-gray-1, #FAFAFA)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-gray-6, #737373)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-gray-10, #171717)" }}
							/>
						</div>
					</div>
					{/* Red Colors */}
					<div className="space-y-2">
						<h3 className="text-label-14 font-semibold">Red</h3>
						<div className="space-y-1">
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-red-1, #FFF5F5)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-red-5, #FF3B3B)" }}
							/>
						</div>
					</div>
					{/* Amber Colors */}
					<div className="space-y-2">
						<h3 className="text-label-14 font-semibold">Amber</h3>
						<div className="space-y-1">
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-amber-1, #FFF8E1)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-amber-5, #FFB300)" }}
							/>
						</div>
					</div>
					{/* Green Colors */}
					<div className="space-y-2">
						<h3 className="text-label-14 font-semibold">Green</h3>
						<div className="space-y-1">
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-green-1, #F5FFF9)" }}
							/>
							<div
								className="h-12 rounded border"
								style={{ backgroundColor: "var(--geist-green-5, #00B37E)" }}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Semantic Colors */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Semantic Colors</h2>
				<div className="space-y-4 p-6 rounded-lg border" style={{
					backgroundColor: "var(--geist-background-1, #FFFFFF)",
					borderColor: "var(--geist-border-1, #EAEAEA)",
				}}>
					<p className="text-copy-16" style={{
						color: "var(--geist-text-10, #111111)",
					}}>
						Primary Text - Geist text primary
					</p>
					<p className="text-copy-16" style={{
						color: "var(--geist-text-9, #666666)",
					}}>
						Secondary Text - Geist text secondary
					</p>
					<div className="p-4 rounded border" style={{
						backgroundColor: "var(--geist-background-2, #F9F9F9)",
						borderColor: "var(--geist-border-1, #EAEAEA)",
					}}>
						Secondary Background with Default Border
					</div>
				</div>
			</section>

			{/* Headings */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Headings</h2>
				<div className="space-y-2">
					<h1 className="text-heading-72">Heading 72</h1>
					<h1 className="text-heading-64">Heading 64</h1>
					<h1 className="text-heading-56">Heading 56</h1>
					<h1 className="text-heading-48">Heading 48</h1>
					<h1 className="text-heading-40">Heading 40</h1>
					<h1 className="text-heading-32">Heading 32</h1>
					<h1 className="text-heading-24">Heading 24</h1>
					<h1 className="text-heading-20">Heading 20</h1>
					<h1 className="text-heading-16">Heading 16</h1>
					<h1 className="text-heading-14">Heading 14</h1>
				</div>
			</section>

			{/* Labels */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Labels</h2>
				<div className="space-y-2">
					<p className="text-label-20">Label 20</p>
					<p className="text-label-18">Label 18</p>
					<p className="text-label-16">Label 16</p>
					<p className="text-label-14">Label 14</p>
					<p className="text-label-13">Label 13</p>
					<p className="text-label-12">Label 12</p>
				</div>
			</section>

			{/* Labels Mono */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Labels Mono</h2>
				<div className="space-y-2">
					<p className="text-label-20-mono">Label 20 Mono</p>
					<p className="text-label-18-mono">Label 18 Mono</p>
					<p className="text-label-16-mono">Label 16 Mono</p>
					<p className="text-label-14-mono">Label 14 Mono</p>
					<p className="text-label-13-mono">Label 13 Mono</p>
					<p className="text-label-12-mono">Label 12 Mono</p>
				</div>
			</section>

			{/* Copy */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Copy</h2>
				<div className="space-y-4">
					<p className="text-copy-24">
						Copy 24 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<p className="text-copy-20">
						Copy 20 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<p className="text-copy-18">
						Copy 18 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<p className="text-copy-16">
						Copy 16 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<p className="text-copy-14">
						Copy 14 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<p className="text-copy-13">
						Copy 13 - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
				</div>
			</section>

			{/* Copy Mono */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Copy Mono</h2>
				<div className="space-y-4">
					<p className="text-copy-24-mono">
						Copy 24 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
					<p className="text-copy-20-mono">
						Copy 20 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
					<p className="text-copy-18-mono">
						Copy 18 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
					<p className="text-copy-16-mono">
						Copy 16 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
					<p className="text-copy-14-mono">
						Copy 14 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
					<p className="text-copy-13-mono">
						Copy 13 Mono - Lorem ipsum dolor sit amet, consectetur adipiscing
						elit.
					</p>
				</div>
			</section>

			{/* Buttons */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Buttons</h2>
				<div className="flex gap-4 items-center">
					<button className="text-button-16 px-4 py-2 rounded" style={{
						backgroundColor: "var(--primary)",
						color: "var(--primary-foreground)",
					}}>
						Button 16
					</button>
					<button className="text-button-14 px-4 py-2 rounded" style={{
						backgroundColor: "var(--primary)",
						color: "var(--primary-foreground)",
					}}>
						Button 14
					</button>
					<button className="text-button-12 px-3 py-1.5 rounded" style={{
						backgroundColor: "var(--primary)",
						color: "var(--primary-foreground)",
					}}>
						Button 12
					</button>
				</div>
			</section>

			{/* Strong and Subtle */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Strong and Subtle</h2>
				<div className="space-y-4">
					<p className="text-copy-16">
						Copy 16 <strong>with Strong</strong>
					</p>
					<p className="text-copy-16">
						Copy 16 <span className="text-subtle">with Subtle</span>
					</p>
					<p className="text-copy-16">
						Copy 16 <strong>with Strong</strong> and{" "}
						<span className="text-subtle">with Subtle</span>
					</p>
				</div>
			</section>

			{/* Example Usage */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Example Usage</h2>
				<div className="space-y-4 p-6 border rounded-lg" style={{
					backgroundColor: "var(--geist-background-1, #FFFFFF)",
					borderColor: "var(--geist-border-1, #EAEAEA)",
				}}>
					<h1 className="text-heading-72" style={{
						color: "var(--geist-text-10, #111111)",
					}}>
						Geist White Theme
					</h1>
					<p className="text-copy-16" style={{
						color: "var(--geist-text-10, #111111)",
					}}>
						This paragraph uses Geist <strong>Typography</strong> in the light theme.
					</p>
					<div className="flex gap-4 mt-4">
						<button
							className="text-button-14 px-6 py-3 rounded-md text-white hover:opacity-90 transition-opacity"
							style={{
								backgroundColor: "var(--geist-blue-6, #0070F3)"
							}}
						>
							Get Started
						</button>
						<button
							className="text-button-14 px-4 py-2 rounded-md border transition-colors"
							style={{
								borderColor: "var(--geist-border-1, #EAEAEA)",
								color: "var(--geist-text-10, #111111)",
								backgroundColor: "var(--geist-background-1, #FFFFFF)",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "var(--geist-border-2, #D4D4D4)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "var(--geist-border-1, #EAEAEA)";
							}}
						>
							Secondary Action
						</button>
					</div>
					<div className="mt-4 p-4 rounded-lg text-copy-14" style={{
						backgroundColor: "var(--geist-blue-1, #F5F9FF)",
						color: "var(--geist-blue-10, #001C55)"
					}}>
						Example using Geist blue-1 background with blue-10 text
					</div>
				</div>
			</section>

			{/* Geist Color Scale */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Geist Color Scale</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Blue Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Blue Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div key={num} className="flex items-center gap-2">
									<div
										className="w-16 h-8 rounded border"
										style={{ backgroundColor: `var(--geist-blue-${num})` }}
									/>
									<span className="text-label-14">blue-{num}</span>
								</div>
							))}
						</div>
					</div>
					{/* Gray Scale */}
					<div className="space-y-2">
						<h3 className="text-label-16 font-semibold">Gray Scale</h3>
						<div className="space-y-1">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<div key={num} className="flex items-center gap-2">
									<div
										className="w-16 h-8 rounded border"
										style={{ backgroundColor: `var(--geist-gray-${num})` }}
									/>
									<span className="text-label-14">gray-{num}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

