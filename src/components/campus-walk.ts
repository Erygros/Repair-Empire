export function getCampusWalkPose(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const phase = (time + 8) % 32;
  const direction = phase < 16 ? 1 : -1;
  return { x: phase < 16 ? -9 + phase * 1.125 : 9 - (phase - 16) * 1.125, direction, stride: Math.sin(time * 5.5) };
}

export function getCampusFounderActivity(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const phase = time % 48;
  const phone = phase >= 20 && phase < 26;
  // Remove resting time from the patrol clock so resuming cannot teleport.
  const walkingTime = time - Math.floor(time / 48) * 6 - Math.min(6, Math.max(0, phase - 20));
  return { ...getCampusWalkPose(walkingTime), phone };
}
