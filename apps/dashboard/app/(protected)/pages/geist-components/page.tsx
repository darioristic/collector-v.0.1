"use client";

import { Badge, Button, Stack, useToasts } from "geist/components";
import { Shield } from "lucide-react";
import type { JSX } from "react";

export default function GeistComponentsPage(): JSX.Element {
	const toasts = useToasts();
	return (
		<div className="container mx-auto p-8 space-y-12">
			<div className="space-y-4">
				<h1 className="text-heading-48">Geist Components</h1>
				<p className="text-copy-16 text-secondary">
					Geist Design System komponente integrisane u Vercel temu.
				</p>
			</div>

			{/* Button Examples */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Button Sizes</h2>
				<Stack
					align="start"
					direction={{ sm: "column", md: "row" }}
					gap={4}
					justify="space-between"
				>
					<Button size="sm">Upload</Button>
					<Button>Upload</Button>
					<Button size="lg">Upload</Button>
				</Stack>
			</section>

			{/* Stack Examples */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Stack Layout</h2>
				<div className="space-y-6">
					<div>
						<h3 className="text-label-16 mb-2">Row Stack</h3>
						<Stack direction="row" gap={4} align="center">
							<Button variant="outline">Item 1</Button>
							<Button variant="outline">Item 2</Button>
							<Button variant="outline">Item 3</Button>
						</Stack>
					</div>
					<div>
						<h3 className="text-label-16 mb-2">Column Stack</h3>
						<Stack direction="column" gap={2} align="start">
							<Button variant="outline">Item 1</Button>
							<Button variant="outline">Item 2</Button>
							<Button variant="outline">Item 3</Button>
						</Stack>
					</div>
					<div>
						<h3 className="text-label-16 mb-2">
							Responsive Stack (Column on mobile, Row on desktop)
						</h3>
						<Stack
							direction={{ sm: "column", md: "row" }}
							gap={4}
							align="start"
							justify="space-between"
						>
							<Button variant="default">Primary</Button>
							<Button variant="outline">Secondary</Button>
							<Button variant="ghost">Tertiary</Button>
						</Stack>
					</div>
				</div>
			</section>

			{/* Button Variants */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Button Variants</h2>
				<Stack direction="column" gap={3} align="start">
					<Button variant="default">Default</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="link">Link</Button>
					<Button variant="destructive">Destructive</Button>
				</Stack>
			</section>

			{/* Badge Examples */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Badge Variants</h2>
				<div className="space-y-6">
					{/* Gray Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Gray Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="gray">
								gray
							</Badge>
							<Badge icon={<Shield />} size="md" variant="gray">
								gray
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="gray">
								gray
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="gray-subtle">
								gray
							</Badge>
							<Badge icon={<Shield />} size="md" variant="gray-subtle">
								gray
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="gray-subtle">
								gray
							</Badge>
						</Stack>
					</div>

					{/* Blue Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Blue Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="blue">
								blue
							</Badge>
							<Badge icon={<Shield />} size="md" variant="blue">
								blue
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="blue">
								blue
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="blue-subtle">
								blue
							</Badge>
							<Badge icon={<Shield />} size="md" variant="blue-subtle">
								blue
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="blue-subtle">
								blue
							</Badge>
						</Stack>
					</div>

					{/* Purple Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Purple Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="purple">
								purple
							</Badge>
							<Badge icon={<Shield />} size="md" variant="purple">
								purple
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="purple">
								purple
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="purple-subtle">
								purple
							</Badge>
							<Badge icon={<Shield />} size="md" variant="purple-subtle">
								purple
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="purple-subtle">
								purple
							</Badge>
						</Stack>
					</div>

					{/* Amber Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Amber Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="amber">
								amber
							</Badge>
							<Badge icon={<Shield />} size="md" variant="amber">
								amber
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="amber">
								amber
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="amber-subtle">
								amber
							</Badge>
							<Badge icon={<Shield />} size="md" variant="amber-subtle">
								amber
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="amber-subtle">
								amber
							</Badge>
						</Stack>
					</div>

					{/* Red Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Red Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="red">
								red
							</Badge>
							<Badge icon={<Shield />} size="md" variant="red">
								red
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="red">
								red
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="red-subtle">
								red
							</Badge>
							<Badge icon={<Shield />} size="md" variant="red-subtle">
								red
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="red-subtle">
								red
							</Badge>
						</Stack>
					</div>

					{/* Pink Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Pink Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="pink">
								pink
							</Badge>
							<Badge icon={<Shield />} size="md" variant="pink">
								pink
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="pink">
								pink
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="pink-subtle">
								pink
							</Badge>
							<Badge icon={<Shield />} size="md" variant="pink-subtle">
								pink
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="pink-subtle">
								pink
							</Badge>
						</Stack>
					</div>

					{/* Green Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Green Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="green">
								green
							</Badge>
							<Badge icon={<Shield />} size="md" variant="green">
								green
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="green">
								green
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="green-subtle">
								green
							</Badge>
							<Badge icon={<Shield />} size="md" variant="green-subtle">
								green
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="green-subtle">
								green
							</Badge>
						</Stack>
					</div>

					{/* Teal Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Teal Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="teal">
								teal
							</Badge>
							<Badge icon={<Shield />} size="md" variant="teal">
								teal
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="teal">
								teal
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="teal-subtle">
								teal
							</Badge>
							<Badge icon={<Shield />} size="md" variant="teal-subtle">
								teal
							</Badge>
							<Badge icon={<Shield />} size="lg" variant="teal-subtle">
								teal
							</Badge>
						</Stack>
					</div>

					{/* Inverted Badges */}
					<div>
						<h3 className="text-label-16 mb-2">Inverted Badges</h3>
						<Stack align="center" direction="row" gap={1}>
							<Badge icon={<Shield />} size="lg" variant="inverted">
								inverted
							</Badge>
							<Badge icon={<Shield />} size="md" variant="inverted">
								inverted
							</Badge>
							<Badge icon={<Shield />} size="sm" variant="inverted">
								inverted
							</Badge>
						</Stack>
					</div>
				</div>
			</section>

			{/* Toast Examples */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Toast Examples</h2>
				<div className="space-y-4">
					<Stack direction="row" gap={2} align="center" className="flex-wrap">
						<Button
							onClick={(): void => {
								toasts.success("The Evil Rabbit jumped over the fence.");
							}}
						>
							Show Success Toast
						</Button>
						<Button
							variant="destructive"
							onClick={(): void => {
								toasts.error("Something went wrong!");
							}}
						>
							Show Error Toast
						</Button>
						<Button
							variant="outline"
							onClick={(): void => {
								toasts.warning("Warning: This action cannot be undone.");
							}}
						>
							Show Warning Toast
						</Button>
						<Button
							variant="outline"
							onClick={(): void => {
								toasts.info("Information: This is a helpful message.");
							}}
						>
							Show Info Toast
						</Button>
						<Button
							variant="outline"
							onClick={(): void => {
								toasts.message({
									text: "The Evil Rabbit jumped over the fence.",
								});
							}}
						>
							Show Message Toast
						</Button>
					</Stack>
				</div>
				<div className="mt-4 p-4 rounded-lg bg-secondary">
					<pre className="text-copy-14 text-secondary overflow-x-auto">
						{`import { Button, useToasts } from 'geist/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  const toasts = useToasts();

  return (
    <>
      <Button
        onClick={(): void => {
          toasts.error('The Evil Rabbit jumped over the fence.');
        }}
      >
        Show Error Toast
      </Button>
      <Button
        onClick={(): void => {
          toasts.message({
            text: 'The Evil Rabbit jumped over the fence.',
          });
        }}
      >
        Show Message Toast
      </Button>
    </>
  );
}`}
					</pre>
				</div>
			</section>

			{/* Usage Example */}
			<section className="space-y-4">
				<h2 className="text-heading-24">Usage Example</h2>
				<div className="p-6 rounded-lg border border-default bg-primary">
					<Stack
						align="start"
						direction={{ sm: "column", md: "row" }}
						gap={4}
						justify="space-between"
					>
						<Button size="sm">Upload</Button>
						<Button>Upload</Button>
						<Button size="lg">Upload</Button>
					</Stack>
				</div>
				<div className="mt-4 p-4 rounded-lg bg-secondary">
					<pre className="text-copy-14 text-secondary overflow-x-auto">
						{`import { Badge, Button, Stack } from '@/components/ui/geist';
import { Shield } from 'lucide-react';

<Stack gap={2}>
  <Stack align="center" direction="row" gap={1}>
    <Badge icon={<Shield />} size="lg" variant="blue">
      blue
    </Badge>
    <Badge icon={<Shield />} size="md" variant="blue">
      blue
    </Badge>
    <Badge icon={<Shield />} size="sm" variant="blue">
      blue
    </Badge>
  </Stack>
</Stack>`}
					</pre>
				</div>
			</section>
		</div>
	);
}
