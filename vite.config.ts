import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";



// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [
			react(),
			babel({ presets: [reactCompilerPreset()] }),
			tailwindcss(),
		],
		resolve: {
			alias: [
				{ find: "@", replacement: path.resolve(__dirname, "src") },
			],
		},
		server: {
			host: env.HOST || "localhost",
			port: Number(env.PORT) || undefined,
		},
	};
});
