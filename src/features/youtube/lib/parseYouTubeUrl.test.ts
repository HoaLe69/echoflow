import { describe, expect, it } from 'vitest'
import { parseYouTubeUrl } from './parseYouTubeUrl'

const ID = 'dQw4w9WgXcQ'

describe('parseYouTubeUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&feature=share`,
    `https://m.youtube.com/watch?v=${ID}`,
    `http://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtu.be/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `youtu.be/${ID}`,
  ])('extracts the ID from %s', (input) => {
    expect(parseYouTubeUrl(input)).toEqual({ videoId: ID })
  })

  it.each([
    [`https://www.youtube.com/watch?v=${ID}&t=90`, 90],
    [`https://www.youtube.com/watch?v=${ID}&t=1m30s`, 90],
    [`https://youtu.be/${ID}?t=1h2m3s`, 3723],
    [`https://www.youtube.com/watch?v=${ID}&start=42`, 42],
    [`https://www.youtube.com/watch?v=${ID}&t=0`, 0],
    [`https://www.youtube.com/watch?v=${ID}&t=90&start=10`, 90],
  ])('reads a start time from %s', (input, startSec) => {
    expect(parseYouTubeUrl(input)).toEqual({ videoId: ID, startSec })
  })

  it('ignores an unparseable start time', () => {
    expect(
      parseYouTubeUrl(`https://www.youtube.com/watch?v=${ID}&t=abc`),
    ).toEqual({ videoId: ID })
  })

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXc',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXc!',
    'https://www.youtube.com/watch',
    'https://www.youtube.com/shorts/dQw4w9WgXc/extra',
    'https://www.youtube.com/embed/dQw4w9WgXc',
    'https://vimeo.com/123456',
    'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=',
    'ftp://youtube.com/watch?v=dQw4w9WgXcQ',
    'javascript:alert(1)',
    '',
    '   ',
    'not a url',
  ])('rejects %s', (input) => {
    expect(parseYouTubeUrl(input)).toBeNull()
  })
})
