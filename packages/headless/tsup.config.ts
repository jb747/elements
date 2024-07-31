import svgr from "esbuild-plugin-svgr"
import { defineConfig, type Options } from "tsup"

const baseConfig: Options = {
  dts: true,
  minify: false,
  sourcemap: true,
  bundle: true,
  clean: true,
  format: ["cjs", "esm"],
}

export default defineConfig([
  {
    ...baseConfig,
    entry: ["src/index.ts"],
    outDir: "dist/",
    treeshake: true,
    external: [
      "react",
      "react-dom",
      "@ory/client-helpers",
      "@ory/client-fetch",
    ],
  },
  {
    ...baseConfig,
    entry: ["src/theme/default/index.ts"],
    outDir: "dist/theme/default",
    external: [
      "react",
      "react-dom",
      "@ory/client-helpers",
      "@ory/client-fetch",
      // TODO(jonas): remove the next.js dependencies
      "next/image",
      "next/navigation",
      "next/link",
    ],

    /* @ts-ignore -- the types of the plugin are wrong? it still works.. */
    esbuildPlugins: [svgr()],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client"',
      }
    },
  },
])
