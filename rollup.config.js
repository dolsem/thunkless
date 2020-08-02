import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
	{
		input: 'src/thunkless.ts',
		output: { name: 'thunkless', file: pkg.browser, format: 'umd' },
		plugins: [typescript({
			tsconfigOverride: {
				compilerOptions: {
					target: 'es3'
				},
			},

		})]
	},
	{
		input: 'src/thunkless.ts',
		output: { file: pkg.main, format: 'cjs' },
		plugins: [typescript({
			tsconfigOverride: {
				compilerOptions: {
					target: 'es5'
				}
			}
		})]
	},
	{
		input: 'src/thunkless.ts',
		output: { file: pkg.module, format: 'es' },
		plugins: [typescript()]
	}
]
