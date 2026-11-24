import { defineConfig, loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import react from '@vitejs/plugin-react'

const localApi = () => ({
  name: 'fuudr-local-api',
  configureServer(server) {
    server.middlewares.use('/api', async (req, res, next) => {
      try {
        const url = new URL(req.url || '/', 'http://localhost')
        const endpoint = url.pathname.replace(/^\//, '')
        if (!['dish-video', 'mux-video', 'mux-webhook', 'bunny-video', 'cloudinary-signature', 'notify-order'].includes(endpoint)) {
          next()
          return
        }

        const { default: handler, POST } = await import(`./api/${endpoint}.js`)
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const rawBody = Buffer.concat(chunks)
        const body = rawBody.length ? rawBody.toString('utf8') : undefined
        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
        }

        if (typeof handler?.fetch === 'function' || typeof POST === 'function') {
          const request = new Request(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`), {
            method: req.method,
            headers,
            ...(body && req.method !== 'GET' && req.method !== 'HEAD'
              ? { body: rawBody, duplex: 'half' }
              : {}),
          })
          const response = typeof handler?.fetch === 'function'
            ? await handler.fetch(request)
            : req.method === 'POST' ? await POST(request) : new Response(null, { status: 405 })
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
          return
        }

        const responseHeaders = new Headers()
        const response = {
          statusCode: 200,
          status(code) { this.statusCode = code; return this },
          setHeader(key, value) { responseHeaders.set(key, value); return this },
          json(value) {
            responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
            res.writeHead(this.statusCode, Object.fromEntries(responseHeaders))
            res.end(JSON.stringify(value))
            return this
          },
          end(value) {
            res.writeHead(this.statusCode, Object.fromEntries(responseHeaders))
            res.end(value)
            return this
          },
        }
        const query = Object.fromEntries(url.searchParams)
        await handler({
          method: req.method,
          headers: Object.fromEntries(headers),
          query,
          body: body ? JSON.parse(body) : undefined,
        }, response)
      } catch (error) {
        server.config.logger.error('Local API request failed', { error })
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Local API request failed.' }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  // Vite exposes .env values through import.meta.env to client code, but these
  // API handlers use process.env. Load them into the server process only.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    if (process.env[key] === undefined) process.env[key] = value
  }
  return {
  plugins: [react(), localApi()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'supabase-vendor',
              test: /node_modules[\\/]@supabase/,
              priority: 40,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)/,
              priority: 30,
            },
            {
              name: 'gsap-vendor',
              test: /node_modules[\\/]gsap/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  }
})

