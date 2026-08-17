import { BaseRoleId, PersonaId } from "./types";

const { INSPECTOR, WHITEHAT, BLACKHAT, INSIDER } = BaseRoleId;

/** Exact base-role distribution by player count, per DESCRIPTION.txt "Chia bài". */
export const BASE_ROLE_DISTRIBUTION: Record<number, BaseRoleId[]> = {
  2: [WHITEHAT, BLACKHAT],
  3: [WHITEHAT, BLACKHAT, INSIDER],
  4: [INSPECTOR, WHITEHAT, BLACKHAT, BLACKHAT],
  5: [INSPECTOR, WHITEHAT, BLACKHAT, BLACKHAT, INSIDER],
  6: [INSPECTOR, WHITEHAT, WHITEHAT, BLACKHAT, BLACKHAT, INSIDER],
  7: [INSPECTOR, WHITEHAT, WHITEHAT, BLACKHAT, BLACKHAT, BLACKHAT, INSIDER],
  8: [INSPECTOR, WHITEHAT, WHITEHAT, WHITEHAT, BLACKHAT, BLACKHAT, BLACKHAT, INSIDER],
};

/** The 8 non-Inspector personas, dealt at random to whoever doesn't hold the Inspector base-role. */
export const NON_INSPECTOR_PERSONAS: PersonaId[] = [
  PersonaId.BOB,
  PersonaId.ALICE,
  PersonaId.BOOLE,
  PersonaId.TURING,
  PersonaId.LOVELACE,
  PersonaId.KEVIN,
  PersonaId.HELLMAN,
  PersonaId.EVE,
];

export function getBaseRoleDistribution(playerCount: number): BaseRoleId[] {
  const dist = BASE_ROLE_DISTRIBUTION[playerCount];
  if (!dist) throw new Error(`Unsupported player count: ${playerCount} (must be 2-8)`);
  return dist;
}
