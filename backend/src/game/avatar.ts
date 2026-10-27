import { z } from 'zod'

export const avatarSchema = z.object({
  body: z.enum(['slim-male', 'broad-male', 'slim-female', 'curvy-female']),
  skin: z.enum(['ivory', 'peach', 'honey', 'tan', 'brown', 'deep']),
  outfit: z.enum(['shirt', 'suit', 'engineer', 'jacket', 'workwear', 'founder']),
}).strict()
export type AvatarConfig = z.infer<typeof avatarSchema>
export const DEFAULT_AVATAR: AvatarConfig = { body: 'slim-male', skin: 'ivory', outfit: 'suit' }
export function avatarOf(raw: unknown): AvatarConfig {
  const parsed = avatarSchema.safeParse(raw)
  return parsed.success ? parsed.data : { ...DEFAULT_AVATAR }
}
