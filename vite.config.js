import { defineConfig } from 'vite';

// Short legal banner prepended to every emitted JS chunk. Written as a
// `/*! ... */` "legal comment" so it is preserved by esbuild's minifier
// and by anyone who later runs the bundle through a beautifier. The
// full terms live in /LICENSE at the repository root; the banner only
// has to put copy/reuse on notice.
const LICENSE_BANNER = `/*!
 * Bone Deformity Simulator: Eulerian Approach
 * Copyright (c) 2026 Christos Nikolaou. All rights reserved.
 *
 * Proprietary and confidential. No license is granted to copy,
 * redistribute, reverse-engineer, de-minify, or use this code (or any
 * bundled textual content) to train machine-learning models. See the
 * LICENSE file in the source repository for the full terms.
 *
 * This application is a teaching aid and is NOT a medical device.
 */
`;

// Tiny plugin that prepends the license banner to every emitted JS
// chunk AFTER esbuild's minifier has run. We can't rely on Rollup's
// `output.banner` alone because Vite runs esbuild minification on the
// whole rendered chunk (banner included), and esbuild hoists its own
// helper `var` declarations to the very top of the file — which pushes
// the banner ~400 bytes down. Doing the prepend in `generateBundle`
// runs after minification, so the banner lands as the first bytes.
function licenseBannerPlugin(banner) {
    return {
        name: 'license-banner',
        generateBundle(_options, bundle) {
            for (const fileName of Object.keys(bundle)) {
                const chunk = bundle[fileName];
                if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
                    chunk.code = banner + chunk.code;
                }
            }
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [licenseBannerPlugin(LICENSE_BANNER)],
    build: {
        // Disable source maps in production so the compiled bundle
        // ships without an accompanying readable copy of the source.
        sourcemap: false,
        // Use esbuild's default minification (fast, mangles names).
        minify: 'esbuild',
        target: 'es2020',
    },
});
