/// <reference types="node" />

const MAX_BYTES = 25 * 1024 * 1024

function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status })
}

async function safeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ])

  const leftBytes = new Uint8Array(leftHash)
  const rightBytes = new Uint8Array(rightHash)
  let difference = 0

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index]
  }

  return difference === 0
}

export async function guardRequest(
  request: Request,
): Promise<Response | null> {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const origin = request.headers.get('origin')
  if (
    origin &&
    allowedOrigins.length > 0 &&
    !allowedOrigins.includes(origin)
  ) {
    return jsonError(403, 'forbidden_origin', 'Origin is not allowed.')
  }

  const expectedPasscode = process.env.TRANSCRIBE_PASSCODE
  if (expectedPasscode) {
    const providedPasscode = request.headers.get('x-echoflow-passcode')
    if (
      !providedPasscode ||
      !(await safeEqual(providedPasscode, expectedPasscode))
    ) {
      return jsonError(401, 'invalid_passcode', 'Invalid passcode.')
    }
  }

  const contentLength = Number(
    request.headers.get('content-length') ?? 0,
  )
  if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
    return jsonError(413, 'too_large', 'Audio file is too large.')
  }

  return null
}

export { MAX_BYTES }
