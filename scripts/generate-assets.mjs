#!/usr/bin/env node
// Fetches persona avatar SVGs from DiceBear's public API (free, no auth, permissive
// license) using a fixed seed per persona so results are stable across re-runs, and
// saves them under client/src/assets/cards/personas/<personaId>.svg.
//
// If the network call fails for a given seed, a deterministic local fallback SVG
// (flat colored circle + initials) is generated instead so the app still works fully
// offline and never ships with a missing/broken asset.
//
// Plain Node ESM, no TypeScript, no build step — run directly:
//   node scripts/generate-assets.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../client/src/assets/cards/personas");

// Must match PersonaId in shared/src/types.ts and PERSONA_CATALOG in shared/src/cards.ts.
const PERSONAS = [
  { id: "INSPECTOR", seed: "m1d-inspector-v1" },
  { id: "BOB", seed: "m1d-bob-v1" },
  { id: "ALICE", seed: "m1d-alice-v1" },
  { id: "BOOLE", seed: "m1d-boole-v1" },
  { id: "TURING", seed: "m1d-turing-v1" },
  { id: "LOVELACE", seed: "m1d-lovelace-v1" },
  { id: "KEVIN", seed: "m1d-kevin-v1" },
  { id: "HELLMAN", seed: "m1d-hellman-v1" },
  { id: "EVE", seed: "m1d-eve-v1" },
];

const DICEBEAR_STYLE = "bottts";
const DICEBEAR_BASE = `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg`;
const FETCH_TIMEOUT_MS = 10_000;

// Flat, deterministic per-persona accent color for the fallback avatar (and used as
// the DiceBear backgroundColor too, so success/fallback look like one coherent set).
const PALETTE = ["0ea5b8", "d6336c", "6741d9", "2f9e44", "e8590c", "1971c2", "f08c00", "ae3ec9", "37b24d"];

function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(id) {
  return id.slice(0, 2).toUpperCase();
}

function fallbackSvg(id) {
  const color = colorFor(id);
  const initials = initialsFor(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="${id} avatar (offline fallback)">
  <rect width="100" height="100" rx="14" fill="#11131e" />
  <circle cx="50" cy="50" r="38" fill="#${color}" />
  <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />
  <text x="50" y="59" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="700"
        fill="#ffffff" text-anchor="middle">${initials}</text>
</svg>`;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("<svg")) throw new Error("Response was not an SVG document");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function generateOne(persona) {
  const { id, seed } = persona;
  const outPath = path.join(OUT_DIR, `${id}.svg`);
  const url = `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&backgroundColor=${colorFor(id)}&radius=14`;

  try {
    const svg = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    await writeFile(outPath, svg, "utf8");
    console.log(`[ok]       ${id} <- DiceBear (seed="${seed}")`);
  } catch (err) {
    const svg = fallbackSvg(id);
    await writeFile(outPath, svg, "utf8");
    console.warn(`[fallback] ${id} — DiceBear fetch failed (${err.message}), wrote local geometric avatar instead`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${PERSONAS.length} persona portraits into ${path.relative(process.cwd(), OUT_DIR)}\n`);
  for (const persona of PERSONAS) {
    // Sequential on purpose: keeps output order readable and is gentle on the API.
    // eslint-disable-next-line no-await-in-loop
    await generateOne(persona);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("generate-assets failed:", err);
  process.exitCode = 1;
});
