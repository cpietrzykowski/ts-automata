import typescript from "@rollup/plugin-typescript";
import htmlTemplate from "rollup-plugin-generate-html-template";

export default [
  {
    input: "./src/index.ts",
    output: {
      file: "./build/app.js",
      format: "iife",
      name: "app",
      sourcemap: true,
    },
    watch: {
      include: "src/**",
    },
    plugins: [
      typescript({
        module: "ESNext",
      }),
      htmlTemplate({
        template: "./src/index.html.template",
        target: "./build/index.html",
      }),
    ],
  },
];
