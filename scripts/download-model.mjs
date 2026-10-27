import { createWriteStream } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'


const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin'

const OUTPUT = 'public/models/ggml-base.en-q5_1.bin'

await mkdir('public/models', { recursive: true })

try {
  await access(OUTPUT)
  console.log(`Model already exists: ${OUTPUT}`)
  process.exit(0)
} catch {
  // download below.
}


console.log('Download Whisper base.en model (~60MB)...')

const response = await fetch(MODEL_URL)

if (!response.ok || !response.body) {
  throw new Error(`Model download failed: ${response.status}`)
}

await pipeline(Readable.fromWeb(response.body), createWriteStream(OUTPUT))

console.log(`Saved ${OUTPUT}`)
