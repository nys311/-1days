export interface SeatPosition {
  left: string;
  top: string;
}

/**
 * Places `seatCount` seats around an ellipse, always putting `mySeatIndex` at the
 * bottom-center (closest to the local hand/action bar) regardless of player count
 * (2-8), with the rest fanned out clockwise from there. Returned array is indexed
 * by absolute seatIndex (0..seatCount-1) so callers can just do positions[seatIndex].
 */
export function computeSeatPositions(seatCount: number, mySeatIndex: number): SeatPosition[] {
  const positions: SeatPosition[] = new Array(seatCount);
  const rx = 44; // % of container width
  const ry = 36; // % of container height

  for (let i = 0; i < seatCount; i++) {
    const offset = (i - mySeatIndex + seatCount) % seatCount;
    const angleDeg = 90 - (offset / seatCount) * 360;
    const angleRad = (angleDeg * Math.PI) / 180;
    const left = 50 + rx * Math.cos(angleRad);
    const top = 50 + ry * Math.sin(angleRad);
    positions[i] = { left: `${left}%`, top: `${top}%` };
  }
  return positions;
}
