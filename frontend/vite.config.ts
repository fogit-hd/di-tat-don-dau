import react from '@vitejs/plugin-react'
import JavaScriptObfuscator from 'javascript-obfuscator'
import { defineConfig, type Plugin } from 'vite'

const target = process.env.API_PROXY || 'http://127.0.0.1:4607'

/** Build-time only: keep dev/HMR readable and avoid transforming third-party libraries. */
function moderateObfuscation(): Plugin {
  return {
    name: 'moderate-app-obfuscation',
    apply: 'build',
    enforce: 'post',
    renderChunk(code, chunk) {
      const hasAppCode = Object.keys(chunk.modules).some(id =>
        !/[/\\]node_modules[/\\]/.test(id) && /[/\\]src[/\\]/.test(id),
      )
      if (!hasAppCode) return null

      return {
        code: JavaScriptObfuscator.obfuscate(code, {
          target: 'browser-no-eval',
          compact: true,
          identifierNamesGenerator: 'hexadecimal',
          identifiersPrefix: `app_${chunk.name.replace(/\W/g, '_')}_`,
          seed: 4517,
          stringArray: true,
          stringArrayThreshold: 0.35,
          stringArrayEncoding: [],
          stringArrayCallsTransform: false,
          stringArrayRotate: false,
          stringArrayShuffle: false,
          stringArrayIndexShift: false,
          stringArrayWrappersCount: 1,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          selfDefending: false,
          disableConsoleOutput: false,
          renameGlobals: false,
          renameProperties: false,
          transformObjectKeys: false,
          splitStrings: false,
          numbersToExpressions: false,
          unicodeEscapeSequence: false,
          sourceMap: false,
        }).getObfuscatedCode(),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), moderateObfuscation()],
  build: {
    sourcemap: false,
    minify: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /[/\\]node_modules[/\\]/ }],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4517,
    strictPort: true,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/health': { target, changeOrigin: true },
      '/socket.io': { target, ws: true, changeOrigin: true },
    },
  },
})
