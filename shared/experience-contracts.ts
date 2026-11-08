/** Duck Race V4 public DTOs. No answer keys or private random draws. */
export const EXPERIENCE_RULES = { durationMs: 480000, capacity: 7, questionMs: 10000, wrongMs: 10000, waitMs: 5000, grantMs: 30000, eraMs: 120000, eraCount: 4, pixelsPerPoint: 3.2, cruiseSpeed: 140, chestRevealMs: 1850, chestDoneMs: 3600 } as const
export type QuizPhase = 'ready' | 'question' | 'chests' | 'opening' | 'target' | 'wait' | 'wrong' | 'complete'
export type ChestKind = 'safe' | 'single' | 'explosive'
export type Cosmetics = { glasses: '' | 'brass' | 'dark'; scarf: '' | 'red' | 'teal' }
export type EventFX = 'lightning' | 'wind' | 'rain' | 'dust' | 'swap'
export type ScoreEvent = { seq: number; at: number; before: number; after: number; delta: number; reason: string; fx?: EventFX; peerId?: string; swapId?: string; fromY?: number; toY?: number }
/** Recipient-specific, server-authored receipt. Never sent before settlement. */
export type ChestNotice = { id: string; at: number; eventId: string; title: string; actorId: string; actorName: string; delta: number; text: string; fx?: EventFX }
export type ChestResult = { id: string; title: string; at: number; lines: { playerId: string; name: string; delta: number; text: string }[] }
export type ChestView = { kind: ChestKind; chosenAt: number; revealAt: number; doneAt: number; result?: ChestResult; targetIds?: string[] }
export type ExperienceView = { elapsed: number; paused: boolean; era: number; capacity: number; grant?: { at: number; value: number }; quiz?: { phase: QuizPhase; until: number; reward: number; number: number; bonus?: boolean }; chest?: ChestView; nextBonus?: number; notices?: ChestNotice[] }
export type RoomEntry = { code: string; phase: 'lobby' | 'countdown' | 'racing' | 'finished'; count: number; capacity: number; available: boolean; message: string; mode?: 'quiz-v4' }
