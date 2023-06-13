import terser from '@rollup/plugin-terser';

export default {
    input: 'html/javascript/components/components.js',
    output: {
        file: 'dist/html/javascript/components.js',
        format: 'es',
        sourcemap: false,
        plugins: [terser()]
    }
}