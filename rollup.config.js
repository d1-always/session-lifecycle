import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const config = [
  // UMD build for browser script tag
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/session-lifecycle.js',
      format: 'umd',
      name: 'SessionLifecycle',
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      typescript({
        target: 'es5',
        module: 'es2015',
        declaration: false,
        sourceMap: false
      })
    ]
  },
  // UMD minified build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/session-lifecycle.min.js',
      format: 'umd',
      name: 'SessionLifecycle',
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      typescript({
        target: 'es5',
        module: 'es2015',
        declaration: false,
        sourceMap: false
      }),
      terser()
    ]
  }
];

export default config;
