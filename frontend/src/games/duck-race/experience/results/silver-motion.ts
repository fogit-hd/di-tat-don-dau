export const SILVER_SWING_MS = 1500;
export const SILVER_RELEASE_MS = 38 / 24 * 1000;
export const SILVER_ROPE_END_MS = SILVER_RELEASE_MS + 650;
const smooth = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };

/** Grip socket is source (32,24), twenty-four pixels above the foot anchor. */
export function silverMotion(age: number, x: number, foot: number, scale: number, height: number) {
  const pivotY = -height * .25;
  const length = (foot - 24 * scale - pivotY) / Math.cos(.08);
  const pivotX = x + length * Math.sin(.08);
  const progress = smooth(age / SILVER_SWING_MS);
  const angle = -1.6 + 1.52 * progress;
  const swingX = pivotX + Math.sin(angle) * length;
  const swingY = pivotY + Math.cos(angle) * length;
  const landed = age >= SILVER_SWING_MS;
  const release = smooth((age - SILVER_RELEASE_MS) / 650);
  const ropeLength = length * (1 - release);
  const ropeAngle = -.08 + release * .45;
  const endX = age <= SILVER_RELEASE_MS ? swingX : pivotX + Math.sin(ropeAngle) * ropeLength;
  const endY = age <= SILVER_RELEASE_MS ? swingY : pivotY + Math.cos(ropeAngle) * ropeLength;
  return {
    x: landed ? x : swingX,
    y: landed ? foot : swingY + 24 * scale,
    pivotX, pivotY, endX, endY,
    attached: age < SILVER_RELEASE_MS,
    ropeVisible: age < SILVER_ROPE_END_MS,
    ropeAlpha: 1 - release,
    landed,
  };
}
