import {defineConfig} from "vite"
import {svelte} from "@sveltejs/vite-plugin-svelte"
import webExtension, {readJsonFile} from "vite-plugin-web-extension"
// @ts-ignore
import tailwindcss from '@tailwindcss/vite'

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json")
  const pkg = readJsonFile("package.json")
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  }
}

// https://vitejs.dev/config/
let target = process.env.TARGET || "chrome"
export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    webExtension({
      manifest: generateManifest,
      browser: target,
      watchFilePaths: ["package.json", "manifest.json"],
      disableAutoLaunch: true
    }),
  ],
  build:{
    outDir: target === "chrome" ? "dist-chrome" : "dist-firefox",
    emptyOutDir: true,
  }
})
