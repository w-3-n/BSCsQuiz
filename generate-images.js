import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import 'dotenv/config';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error('ERROR: REPLICATE_API_TOKEN not set in .env');
  process.exit(1);
}

const BASE_STYLE =
  'ancient Egyptian wall painting, hieroglyphic art style, flat 2D illustration, bold black outlines, limited ochre and terracotta and sand palette, profile view, no background, transparent background, isolated subject, highly detailed, vector-like';

// All images to generate
// key: output file path (relative to project root)
// prompt: full prompt sent to flux-schnell
const IMAGES = [
  // ── SCENE 1: Wheat ────────────────────────────────────────────────────────
  {
    file: 'images/scene1/background.png',
    prompt: `${BASE_STYLE}, ancient Egyptian agricultural Nile delta landscape background, fertile fields with irrigation canals, flat sandy terrain, blue sky with Ra sun disk, horizontal panoramic scene, 16:9 ratio`,
  },
  {
    file: 'images/scene1/cow.png',
    prompt: `${BASE_STYLE}, Egyptian sacred cow, Hathor cow, side profile walking, gentle expression, hieroglyphic flat art`,
  },
  {
    file: 'images/scene1/farmer.png',
    prompt: `${BASE_STYLE}, ancient Egyptian male farmer, wearing white linen shendyt kilt, holding a wooden hoe, side profile, harvesting pose`,
  },
  {
    file: 'images/scene1/bowl_of_bread.png',
    prompt: `${BASE_STYLE}, ancient Egyptian clay bowl filled with round flatbread loaves, food offering, side view`,
  },
  {
    file: 'images/scene1/wheat.png',
    prompt: `${BASE_STYLE}, sheaf of golden wheat stalks bundled together, Egyptian emmer wheat, upright, isolated`,
  },

  // ── SCENE 2: Flax ────────────────────────────────────────────────────────
  {
    file: 'images/scene2/background.png',
    prompt: `${BASE_STYLE}, ancient Egyptian agricultural Nile delta landscape background, fertile fields with irrigation canals, flat sandy terrain, blue sky with Ra sun disk, horizontal panoramic scene, 16:9 ratio`,
  },
  {
    file: 'images/scene2/weaver.png',
    prompt: `${BASE_STYLE}, ancient Egyptian woman weaving on a ground loom, side profile, wearing linen dress, hieroglyphic flat art`,
  },
  {
    file: 'images/scene2/linen_cloth.png',
    prompt: `${BASE_STYLE}, ancient Egyptian white linen cloth folded neatly, textile, isolated side view`,
  },
  {
    file: 'images/scene2/spindle.png',
    prompt: `${BASE_STYLE}, ancient Egyptian wooden drop spindle with spun thread, isolated object`,
  },
  {
    file: 'images/scene2/flax.png',
    prompt: `${BASE_STYLE}, bundle of blue-flowering flax plant stalks, linen flax, upright sheaf, isolated`,
  },

  // ── SCENE 3: Papyrus ─────────────────────────────────────────────────────
  {
    file: 'images/scene3/background.png',
    prompt: `${BASE_STYLE}, ancient Egyptian Nile riverbank landscape background, lotus flowers and reeds along water, flat sandy terrain, blue sky with Ra sun disk, horizontal panoramic scene, 16:9 ratio`,
  },
  {
    file: 'images/scene3/scribe.png',
    prompt: `${BASE_STYLE}, ancient Egyptian scribe seated cross-legged, writing on a scroll with a reed pen, side profile`,
  },
  {
    file: 'images/scene3/scroll.png',
    prompt: `${BASE_STYLE}, ancient Egyptian papyrus scroll with hieroglyphs written on it, rolled open, isolated`,
  },
  {
    file: 'images/scene3/ibis.png',
    prompt: `${BASE_STYLE}, sacred ibis bird, Thoth symbol, standing in profile, long curved beak, black and white plumage`,
  },
  {
    file: 'images/scene3/papyrus.png',
    prompt: `${BASE_STYLE}, tall papyrus reed plant, triangular stem with feathery crown, upright bundle, isolated, Nile plant`,
  },

  // ── SEEDS (correct + wrong options) ──────────────────────────────────────
  // Scene 1 seeds
  {
    file: 'seeds/wheat_seed.png',
    prompt: `${BASE_STYLE}, small pouch or pile of wheat grain seeds, individual wheat kernels, ancient Egyptian art style, close-up isolated`,
  },
  {
    file: 'seeds/flax_seed.png',
    prompt: `${BASE_STYLE}, small round flax seeds in a tiny clay bowl or pile, ancient Egyptian art style, isolated`,
  },
  {
    file: 'seeds/papyrus_seed.png',
    prompt: `${BASE_STYLE}, small papyrus reed rhizome or seed cluster, ancient Egyptian art style, isolated`,
  },
  {
    file: 'seeds/lotus_seed.png',
    prompt: `${BASE_STYLE}, lotus flower seed pod with seeds, ancient Egyptian art style, isolated object`,
  },
];

async function runReplicate(prompt) {
  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        output_quality: 90,
        go_fast: true,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate API error: ${createRes.status} ${err}`);
  }

  const prediction = await createRes.json();

  // Poll if not done
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    result = await pollRes.json();
  }

  if (result.status === 'failed') {
    throw new Error(`Prediction failed: ${result.error}`);
  }

  return result.output[0]; // URL of generated image
}

async function downloadImage(url, filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  await pipeline(res.body, createWriteStream(filePath));
}

async function main() {
  console.log(`Generating ${IMAGES.length} images via Replicate flux-schnell...\n`);

  for (let i = 0; i < IMAGES.length; i++) {
    const { file, prompt } = IMAGES[i];

    // Skip if already exists
    if (fs.existsSync(file)) {
      console.log(`[${i + 1}/${IMAGES.length}] SKIP (exists): ${file}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${IMAGES.length}] Generating: ${file} ... `);
    try {
      const imageUrl = await runReplicate(prompt);
      await downloadImage(imageUrl, file);
      console.log('done');
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nAll done! Images saved to images/ and seeds/ folders.');
}

main();
