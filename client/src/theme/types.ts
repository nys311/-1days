import type { ThemeVars } from "./vars";

export interface ThemeManifest {
  id: string;
  name: string;
  description: string;
  vars: ThemeVars;
}
