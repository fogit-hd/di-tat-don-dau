import type { RacerView } from '../../contracts';
import { BRONZE_STEP_MS } from './bronze-motion';
import { SILVER_SWING_MS } from './silver-motion';
export type AwardPhase = 'intro' | 'third' | 'second' | 'first' | 'stow' | 'retrieve' | 'raise' | 'hold' | 'wear' | 'final';
export type ResultPlayer = Pick<RacerView, 'id' | 'name' | 'color' | 'points' | 'rank' | 'cosmetics'>;
export const SHEETS = {
    'winner-hat': { frames: 36, cell: 96, columns: 12, anchorY: 88 },
    'winner-shuffle': { frames: 96, cell: 96, columns: 12, anchorY: 88 },
    'winner-heel-toe': { frames: 96, cell: 96, columns: 12, anchorY: 88 },
    'winner-wing-pop': { frames: 96, cell: 96, columns: 12, anchorY: 88 },
    'bronze-skate': { frames: 96, cell: 128, columns: 8, anchorY: 118 },
    'silver-swing': { frames: 96, cell: 128, columns: 8, anchorY: 118 },
    'winner-parachute': { frames: 12, cell: 96, columns: 12, anchorY: 88 },
    'winner-stow': { frames: 10, cell: 96, columns: 10, anchorY: 88 },
    'winner-coronation': { frames: 40, cell: 96, columns: 8, anchorY: 88 },
    'winner-crowned-idle': { frames: 4, cell: 96, columns: 4, anchorY: 88 },
} as const;
export type Sheet = keyof typeof SHEETS;
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export function resultPlayers(players: readonly ResultPlayer[]) {
    const ids = new Set<string>();
    return [...players].filter(p => { if (p.rank <= 0 || !Number.isInteger(p.rank) || ids.has(p.id))
        return false; ids.add(p.id); return true; }).sort((a, b) => a.rank - b.rank);
}
export function awardSchedule(players: readonly ResultPlayer[]) {
    const starts: Record<number, number> = {};
    let cursor = 700;
    for (const rank of [3, 2, 1])
        if (players.some(p => p.rank === rank)) {
            starts[rank] = cursor;
            cursor += rank === 3 ? 4400 : rank === 2 ? 4100 : 11000;
        }
    const first = starts[1] ?? cursor, stow = first + 2800;
    return { starts, stow, stowEnd: stow + 1100, retrieve: stow + 2800, raise: stow + 4000, hold: stow + 5200, wear: stow + 5800, crowned: stow + 7600, total: players.length ? first + 12500 : 0 };
}
export type Schedule = ReturnType<typeof awardSchedule>;
export function phaseAt(time: number, s: Schedule): AwardPhase {
    if (!s.total)
        return 'final';
    if (time < 700)
        return 'intro';
    if (s.starts[3] !== undefined && time < (s.starts[2] ?? s.starts[1] ?? s.total))
        return 'third';
    if (s.starts[2] !== undefined && time < (s.starts[1] ?? s.total))
        return 'second';
    if (time < s.stow)
        return 'first';
    if (time < s.retrieve)
        return 'stow';
    if (time < s.raise)
        return 'retrieve';
    if (time < s.hold)
        return 'raise';
    if (time < s.wear)
        return 'hold';
    return time < s.crowned ? 'wear' : 'final';
}
export function awardLayout(w: number, h: number) {
    const mobile = w < 769, iw = Math.max(1, Math.min(w * (mobile ? .98 : .88), Math.max(80, h - 205) * 1.5)), ih = iw / 1.5;
    return { iw, ih, ix: (w - iw) / 2, iy: mobile ? Math.max(105, (h - ih) * .48) : h - 80 - ih, scale: clamp(iw / 190, mobile ? 2.7 : 3.3, 5.8) };
}
export function awardPad(rank: number, l: ReturnType<typeof awardLayout>) {
    const anchor = rank === 1 ? .5 : rank === 2 ? .179 : .817, pad = rank === 1 ? .303 : rank === 2 ? .43 : .49;
    return { x: l.ix + l.iw * anchor, y: l.iy + l.ih * pad, labelY: l.iy + l.ih * .98 + 8, labelWidth: Math.max(95, l.iw * .28) };
}
export function actorPose(rank: number, time: number, s: Schedule) {
    const start = s.starts[rank], age = time - (start ?? Infinity);
    const visible = start !== undefined && age >= 0;
    if (rank === 2 || rank === 3) {
        const key = rank === 2 ? 'silver-swing' : 'bronze-skate';
        const spec = SHEETS[key];
        const landingMs = rank === 2 ? SILVER_SWING_MS : BRONZE_STEP_MS;
        const frame = Math.min(spec.frames - 1, Math.max(0, Math.floor(age / 1000 * 24)));
        return { visible, landed: age >= landingMs, p: clamp(age / landingMs), key, frame,
            alpha: 1, offset: 0, cell: spec.cell, anchorY: spec.anchorY };
    }
    const p = clamp(age / 2800), landed = age >= 2800;
    let key: Sheet | 'idle' = 'idle', frame = 0;
    if (!landed) {
        key = 'winner-parachute';
        frame = Math.floor(time / 120) % 12;
    } else if (time < s.stowEnd) {
        key = 'winner-stow';
        frame = Math.min(9, Math.floor((time - s.stow) / 1100 * 10));
    } else if (time < s.retrieve) {
        key = 'winner-hat';
        frame = Math.min(35, Math.floor((time - s.stowEnd) / 1700 * 36));
    } else if (time < s.raise) {
        key = 'winner-coronation';
        frame = Math.min(11, Math.floor((time - s.retrieve) / 1200 * 12));
    } else if (time < s.hold) {
        key = 'winner-coronation';
        frame = 12 + Math.min(11, Math.floor((time - s.raise) / 1200 * 12));
    } else if (time < s.wear) {
        key = 'winner-coronation';
        frame = 23;
    } else if (time < s.crowned) {
        key = 'winner-coronation';
        frame = 24 + Math.min(15, Math.floor((time - s.wear) / 1800 * 16));
    } else {
        const dances: Sheet[] = ['winner-shuffle', 'winner-heel-toe', 'winner-wing-pop'];
        const danceTime = time - s.crowned;
        key = dances[Math.floor(danceTime / 4000) % 3];
        frame = Math.floor(danceTime % 4000 / 1000 * 24);
    }
    return { visible, landed, p, key, frame, alpha: 1, offset: 0,
        cell: SHEETS[key].cell,
        anchorY: SHEETS[key].anchorY };
}
