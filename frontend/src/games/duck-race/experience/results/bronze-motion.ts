export const BRONZE_RIDE_MS = 20 / 24 * 1000;
export const BRONZE_STEP_MS = 32 / 24 * 1000;
export const BRONZE_KICK_MS = 38 / 24 * 1000;
export const BRONZE_BOARD_EXIT_MS = 75 / 24 * 1000;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function bronzeMotion(age: number, x: number, foot: number, scale: number, width: number) {
  const nearX = x + 12 * scale;
  const nearY = foot;
  const farX = width + 64 * scale;
  const farY = foot + Math.min(50, scale * 10);
  const ride = clamp((age - 240) / (BRONZE_RIDE_MS - 240));
  const approach = 1 - (1 - ride) ** 3;
  const departure = clamp((age - BRONZE_KICK_MS) / (BRONZE_BOARD_EXIT_MS - BRONZE_KICK_MS)) ** 2;
  const boardX = age < BRONZE_KICK_MS
    ? farX + (nearX - farX) * approach
    : nearX + (farX - nearX) * departure;
  const boardY = age < BRONZE_KICK_MS
    ? farY + (nearY - farY) * approach
    : nearY + (farY - nearY) * departure;
  const angle = Math.atan2(farY - nearY, farX - nearX);
  const straighten = 1 - smooth((age - 21 / 24 * 1000) / (6 / 24 * 1000));
  const riding = age < 21 / 24 * 1000;
  const deploy = 1 - smooth(age / 200);
  const retract = smooth((age - 76 / 24 * 1000) / (10 / 24 * 1000));
  const rampOffset = Math.max(deploy, retract);

  return {
    boardX, boardY, angle, nearX, nearY, farX, farY,
    boardVisible: age < 76 / 24 * 1000,
    bodyX: riding ? boardX - 12 * scale : x,
    bodyY: riding ? boardY : foot,
    bodyAngle: angle * straighten,
    pivotX: riding ? boardX : nearX,
    pivotY: riding ? boardY : nearY,
    rampX: nearX + (farX - nearX) * rampOffset,
    rampY: nearY + (farY - nearY) * rampOffset,
    rampLength: Math.hypot(farX - nearX, farY - nearY) * (1 - rampOffset),
    rampVisible: rampOffset < 1,
  };
}
