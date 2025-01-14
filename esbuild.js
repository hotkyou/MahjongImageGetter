const esbuild = require("esbuild");
const glob = require("glob");

const entryPoints = glob.sync("src/**/*.js");

esbuild
    .build({
        entryPoints: entryPoints,
        outdir: "dist",
        bundle: true,
        minify: true,
        format: "esm",
        target: ["chrome58", "firefox57", "safari11", "edge16"]
    })
    .catch(() => process.exit(1));
