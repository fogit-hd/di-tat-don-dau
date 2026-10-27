export const BODY_OPTIONS = [
  ['slim-male','Dáng 1'], ['broad-male','Dáng 2'], ['slim-female','Dáng 3'], ['curvy-female','Dáng 4'],
] as const
export const SKIN_OPTIONS = [
  ['ivory','#f2caa0'],['peach','#dfaa7c'],['honey','#c68e59'],['tan','#a96e42'],['brown','#825032'],['deep','#553323'],
] as const
export const OUTFIT_OPTIONS = [
  ['shirt','Sơ mi'],['suit','Vest CEO'],['engineer','Kỹ sư'],['jacket','Áo khoác'],['workwear','Công xưởng'],['founder','Nhà sáng lập'],
] as const
export type AvatarConfig = { body: typeof BODY_OPTIONS[number][0]; skin: typeof SKIN_OPTIONS[number][0]; outfit: typeof OUTFIT_OPTIONS[number][0] }
export const DEFAULT_AVATAR: AvatarConfig = { body:'slim-male',skin:'ivory',outfit:'suit' }
export function avatarOf(raw?: Partial<AvatarConfig> | null): AvatarConfig {
  return {
    body:BODY_OPTIONS.some(([id])=>id===raw?.body)?raw!.body!:DEFAULT_AVATAR.body,
    skin:SKIN_OPTIONS.some(([id])=>id===raw?.skin)?raw!.skin!:DEFAULT_AVATAR.skin,
    outfit:OUTFIT_OPTIONS.some(([id])=>id===raw?.outfit)?raw!.outfit!:DEFAULT_AVATAR.outfit,
  }
}
export function avatarArt(avatar?: Partial<AvatarConfig> | null, portrait=false) {
  const a=avatarOf(avatar)
  return `/assets/avatars/v1/${a.body}/${a.skin}/${a.outfit}${portrait?'-portrait':''}.webp`
}
export const sameAvatar=(a:AvatarConfig,b:AvatarConfig)=>a.body===b.body&&a.skin===b.skin&&a.outfit===b.outfit
