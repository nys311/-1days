import type { ThemeManifest } from "./types";
import { cyberNeonTheme } from "./manifests/cyberNeon";
import { terminalMonoTheme } from "./manifests/terminalMono";

// Adding a 3rd theme = add one manifest object here + its assets. No component or
// CSS file needs to change, because everything themeable reads from CSS vars that
// ThemeProvider derives from the active manifest.
export const THEME_REGISTRY: ThemeManifest[] = [cyberNeonTheme, terminalMonoTheme];

export const DEFAULT_THEME_ID = cyberNeonTheme.id;

export function getTheme(id: string): ThemeManifest {
  return THEME_REGISTRY.find((t) => t.id === id) ?? cyberNeonTheme;
}
