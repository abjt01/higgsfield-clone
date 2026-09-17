/**
 * Seeds public generations so the feed, pagination and remix have content.
 *
 * Images point at the preset thumbnails already in public/, so seeding costs no
 * provider quota and works offline. Rows are inserted directly rather than
 * through the API because the rate limiter would (correctly) reject a burst.
 *
 *   node scripts/seed-feed.mjs [count]
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir } from 'node:fs/promises'

const sh = promisify(execFile)
const DB = process.env.SEED_DB ?? 'higgsfield_dev'
// psql prints the command tag ("INSERT 0 1") on stdout alongside RETURNING
// output, so take the first line only.
const psql = async (q) =>
  (await sh('psql', ['-d', DB, '-t', '-A', '-c', q], { maxBuffer: 32 * 1024 * 1024 })).stdout
    .trim()
    .split('\n')[0]

const count = Number(process.argv[2] ?? 60)

const thumbs = (await readdir('public/presets')).filter((f) => f.endsWith('.webp'))
const cameras = ['crash-zoom-in','dolly-in','orbit-left','bullet-time','pan-left','drone-pull-back','low-angle-hero','whip-pan-right']
const styles = ['cinematic','neon-noir','anime','film-noir','watercolour','cyberpunk','golden-hour','brutalist']
const subjects = [
  'a lone samurai on a neon rooftop','an abandoned space station orbiting a gas giant',
  'a rain-slicked Tokyo alley at night','a lighthouse in a storm',
  'a desert highway at golden hour','a cathedral of glass and moss',
  'a fox curled in autumn leaves','a diver descending into a kelp forest',
]

const q = (s) => `'${String(s).replace(/'/g, "''")}'`

const userId = await psql(
  `insert into users (display_name, credits) values ('seed-bot', 999) returning id`,
)

// One statement rather than `count` round trips: 60 sequential psql processes
// took longer than the rest of the seed put together.
const rows = []
for (let i = 0; i < count; i++) {
  const camera = cameras[i % cameras.length]
  const style = styles[(i * 3) % styles.length]
  const subject = `${subjects[i % subjects.length]} #${i + 1}`
  const thumb = thumbs[i % thumbs.length]
  const ratio = ['1:1', '16:9', '9:16', '4:3'][i % 4]

  rows.push(
    `(${q(userId)}, ${q(subject + '. seeded scaffold text.')}, ${q(subject)}, ` +
      `${q(camera)}, ${q(style)}, ${q(ratio)}, 'seed', 'seed', ` +
      `${q('/presets/' + thumb)}, 'image/webp', 'public', now() - (${i} * interval '1 minute'))`,
  )
}

await psql(`
  insert into generations
    (user_id, prompt, subject, camera_preset_id, preset_id, aspect_ratio,
     provider, model, image_url, mime, visibility, created_at)
  values ${rows.join(',\n')}
`)

console.log(`seeded ${count} public generations as seed-bot`)
