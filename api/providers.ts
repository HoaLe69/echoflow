export const config = { runtime: 'edge' }

export default function handler(request: Request) {
  if (request.method !== 'GET') {
    return Response.json(
      { error: { code: 'method_not_allowed', message: 'GET only.' } },
      { status: 405 },
    )
  }

  return Response.json(
    {
      groq: Boolean(process.env.GROQ_API_KEY),
      assemblyai: Boolean(process.env.ASSEMBLYAI_API_KEY),
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
