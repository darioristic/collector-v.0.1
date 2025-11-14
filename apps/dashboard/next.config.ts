import type { NextConfig } from "next";

// Next.js automatically loads .env files, no need to manually load dotenv

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	assetPrefix: isProduction ? "https://dashboard.shadcnuikit.com" : undefined,
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
			},
			{
				protocol: "https",
				hostname: "bundui-images.netlify.app",
			},
		],
	},
	async redirects() {
		return [
			// Dashboard redirects
			{
				source: "/finance",
				destination: "/dashboard",
				permanent: false,
			},
			// Vault redirects
			{
				source: "/file-manager",
				destination: "/vault",
				permanent: false,
			},
			// HR redirects
			{
				source: "/employee-dashboard",
				destination: "/hr/dashboard",
				permanent: false,
			},
			// Projects redirects
			{
				source: "/project-management",
				destination: "/projects",
				permanent: false,
			},
			{
				source: "/project-list",
				destination: "/projects/list",
				permanent: false,
			},
			// Profile redirects
			{
				source: "/pages/profile",
				destination: "/profile",
				permanent: false,
			},
			// Settings redirects
			{
				source: "/pages/settings",
				destination: "/settings",
				permanent: false,
			},
			{
				source: "/pages/settings/account",
				destination: "/settings/account",
				permanent: false,
			},
			{
				source: "/pages/settings/billing",
				destination: "/settings/billing",
				permanent: false,
			},
			{
				source: "/pages/settings/appearance",
				destination: "/settings/appearance",
				permanent: false,
			},
			{
				source: "/pages/settings/notifications",
				destination: "/settings/notifications",
				permanent: false,
			},
			{
				source: "/pages/settings/display",
				destination: "/settings/display",
				permanent: false,
			},
		];
	},
	// Webpack config only applies when NOT using Turbopack
	// When using --turbo flag, this config is ignored
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer) {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
			};
		}
		// For Docker builds, resolve modules from workspace root
		if (process.env.DOCKER_BUILD === "true") {
			config.resolve = config.resolve || {};
			config.resolve.modules = [
				...(config.resolve.modules || []),
				"/workspace/node_modules",
				"node_modules",
			];
			config.resolve.symlinks = false;
		}
		return config;
	},
	// Turbopack configuration (used with --turbo flag)
	// Turbopack has better hot reload performance than webpack
	turbopack: {
		// Set root directory to workspace root for monorepo support
		// This tells Turbopack where to find node_modules and packages
		root: process.env.DOCKER_BUILD === "true" ? "/workspace" : undefined,
	},
	// Enable standalone output for Docker builds
	// This creates a self-contained build with all dependencies
	output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
	// Transpile packages from workspace for monorepo support
	transpilePackages: process.env.DOCKER_BUILD === "true" 
		? ["@crm/ui", "@crm/types"]
		: [],
};

export default nextConfig;
