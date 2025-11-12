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
