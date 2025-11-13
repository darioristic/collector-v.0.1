import { config } from "dotenv";
import type { NextConfig } from "next";

config();

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
		return config;
	},
	// Turbopack configuration (used with --turbo flag)
	// Turbopack has better hot reload performance than webpack
	turbopack: {
		// Turbopack automatically watches files for changes
		// No additional configuration needed for hot reload
	},
};

export default nextConfig;
