import { BaseRoleId, GameState, PlayerStatus, Winner } from "@minus1days/shared";

/** Re-evaluates win conditions from ground truth (real roles/status), independent of what's been publicly revealed. */
export function checkWinConditions(state: GameState): Winner {
  if (state.winner) return state.winner;

  const alive = state.players.filter((p) => p.status === PlayerStatus.ALIVE);
  const blackhats = state.players.filter((p) => p.baseRole === BaseRoleId.BLACKHAT);
  const whitehats = state.players.filter((p) => p.baseRole === BaseRoleId.WHITEHAT);
  const insider = state.players.find((p) => p.baseRole === BaseRoleId.INSIDER);

  const allBlackhatsDown = blackhats.length > 0 && blackhats.every((p) => p.status === PlayerStatus.DOWN);
  const allWhitehatsDown = whitehats.length > 0 && whitehats.every((p) => p.status === PlayerStatus.DOWN);

  // Most specific condition first: both hats eliminated together means the Insider's exact win
  // condition is met, even in the same event that would otherwise also satisfy Whitehat's.
  if (allBlackhatsDown && allWhitehatsDown && insider) {
    return { faction: "INSIDER", reason: "Toàn bộ White Hat và Black Hat đã bị hạ gục." };
  }
  if (allBlackhatsDown) {
    return { faction: "WHITEHAT_INSPECTOR", reason: "Toàn bộ Black Hat đã bị hạ gục." };
  }

  // Last-survivor fallback so the game always terminates even in small tables.
  if (alive.length === 1) {
    const last = alive[0];
    if (last.baseRole === BaseRoleId.BLACKHAT) return { faction: "BLACKHAT", reason: "Là người chơi cuối cùng còn sống sót." };
    if (last.baseRole === BaseRoleId.INSIDER) return { faction: "INSIDER", reason: "Là người chơi cuối cùng còn sống sót." };
    return { faction: "WHITEHAT_INSPECTOR", reason: "Là người chơi cuối cùng còn sống sót." };
  }

  return null;
}

/** Called the instant a FLAG card is claimed from THE KERN. */
export function checkFlagCapture(state: GameState, claimerBaseRole: BaseRoleId | null): Winner {
  if (claimerBaseRole === BaseRoleId.BLACKHAT) {
    return { faction: "BLACKHAT", reason: "Black Hat đã lấy được FLAG trong THE KERN." };
  }
  return null;
}
