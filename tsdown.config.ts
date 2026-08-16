/**
 * Standalone tsdown config for the peak-hours package, mirroring the dsh-web-ui
 * family's artifact shape: tsc emits to lib/types, then tsdown bundles the
 * node half (lib/index.js + lib/invariant.js, ESM) and the browser client
 * (lib/client.js, CJS wrapped in window.__ModuleLoader__.load with CSS Modules
 * inlined through lightningcss).
 *
 * When merged into the dsh-web-ui repo, align this with the family's shared
 * build preset (scripts/sync-shared.mjs and its tsdown helper) instead of
 * maintaining a per-package copy.
 */
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { UserConfig } from 'tsdown'

const ID = '@linxin666/dsh-client-ui-peak-hours'

/** Externals the browser bundle resolves from the loader module table at runtime. */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/dsh-client-runtime/client',
]

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** Compile CSS Modules into a hashed class map plus one self-injecting <style> tag. */
function cssModulesPlugin(): NonNullable<UserConfig['plugins']> {
  return [{
    name: 'peak-hours-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? resolve(dirname(importer), source) : source
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin=${JSON.stringify(ID)}]') === null) {`,
        '  const tag = document.createElement(\'style\');',
        `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }]
}

/** Node-half library: ESM, deps external, emitted beside the client bundle. */
const nodeLibrary: UserConfig = {
  name: ID,
  entry: ['lib/types/index.js', 'lib/types/invariant.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  dts: false,
  clean: false,
}

/** Browser client bundle: module-loader wrapped, platform modules external. */
const client: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'lib/types/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: [...CLIENT_EXTERNALS],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
  plugins: [...cssModulesPlugin()],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports; Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
  },
}

export default [nodeLibrary, client]
