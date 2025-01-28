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
        target: "es2015",
        loader: { '.js': 'jsx' },
        jsx: 'automatic',
        define: {
            'process.env.NODE_ENV': '"production"'
        }
    })
    .catch(() => process.exit(1));