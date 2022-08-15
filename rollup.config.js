import typescript from "@rollup/plugin-typescript";
import htmlTemplate from "rollup-plugin-generate-html-template";

export default [
  {
    input: "./src/index.ts",
    output: {
      file: "./build/app.js",
      format: "cjs",
      sourcemap: true,
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
