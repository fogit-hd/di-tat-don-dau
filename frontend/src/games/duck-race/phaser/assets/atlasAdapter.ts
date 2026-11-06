import Phaser from 'phaser'

type NativeAtlas = { frames: Record<string, unknown>; animations: Record<string, string[]> }
export const DUCK_ATLAS = 'duck-native-v12'

/** Adapt the existing Pixi-format animation metadata without repacking/cropping its pixels. */
export function registerNativeClips(scene: Phaser.Scene) {
  const atlas = scene.cache.json.get('native-clip-data') as NativeAtlas
  const clips = new Map<string, string[]>()
  scene.textures.get(DUCK_ATLAS).setFilter(Phaser.Textures.FilterMode.NEAREST)
  for (const [key, names] of Object.entries(atlas.animations)) {
    if (!key.startsWith('duckee/')) continue
    const valid = names.filter(name => scene.textures.getFrame(DUCK_ATLAS, name))
    if (valid.length !== names.length) throw new Error(`Native clip is incomplete: ${key}`)
    clips.set(key, valid)
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: valid.map(frame => ({ key: DUCK_ATLAS, frame })), frameRate: 10, repeat: -1 })
  }
  return clips
}
