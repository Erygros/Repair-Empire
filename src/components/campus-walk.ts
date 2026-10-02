export function getCampusWalkPose(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const phase = (time + 8) % 32;
  const direction = phase < 16 ? 1 : -1;
  return { x: phase < 16 ? -9 + phase * 1.125 : 9 - (phase - 16) * 1.125, direction, stride: Math.sin(time * 5.5) };
}
