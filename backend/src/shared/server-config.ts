/** Transport configuration is shared; each game keeps its own state and handlers. */
export function allowedOrigins() {
  return (process.env.CORS_ORIGINS || [
    'https://ditatdondau.neoforcelab.com', 'https://neoforcelab.com',
    'http://localhost:4517', 'http://127.0.0.1:4517',
    'http://localhost:4525', 'http://127.0.0.1:4525',
    'http://localhost:4607', 'http://127.0.0.1:4607',
  ].join(',')).split(',').map(origin => origin.trim()).filter(Boolean)
}
