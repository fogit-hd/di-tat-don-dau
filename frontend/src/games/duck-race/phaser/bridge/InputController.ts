import Phaser from 'phaser'
import type { RaceAction } from './SimulationBridge'
import { SimulationBridge } from './SimulationBridge'

const movement: Record<string, string> = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'crouch', ShiftRight: 'crouch' }
export type HeldControl = 'up' | 'down' | 'left' | 'right' | 'crouch' | 'guard'
export class InputController {
  private held = new Map<string, string>()
  private enabled = true
  private keyboard?: Phaser.Input.Keyboard.KeyboardPlugin
  private scene: Phaser.Scene
  private bridge: SimulationBridge
  constructor(scene: Phaser.Scene, bridge: SimulationBridge) {
    this.scene = scene; this.bridge = bridge; this.keyboard = scene.input.keyboard || undefined
    this.keyboard?.on('keydown', this.down)
    this.keyboard?.on('keyup', this.up)
    scene.input.on('pointerdown', this.pointerDown)
    scene.input.on('pointerup', this.pointerUp)
    scene.input.on('pointerupoutside', this.pointerUp)
    scene.input.on('gameout', this.releaseMouse)
    window.addEventListener('blur', this.release)
    document.addEventListener('visibilitychange', this.release)
  }
  private editable(event: KeyboardEvent) {
    return event.target instanceof HTMLElement && (event.target.matches('input,textarea,select') || event.target.isContentEditable
      || (event.target.matches('button') && ['Space', 'Enter'].includes(event.code)))
  }
  private down = (event: KeyboardEvent) => {
    if (!this.enabled || this.editable(event)) return
    const held = movement[event.code], action = event.code === 'Space' ? 'jump' : event.code === 'KeyE' ? 'roll' : event.code === 'KeyF' ? 'attack' : undefined
    if (!held && !action) return
    event.preventDefault()
    if (held) { this.held.set(event.code, held); this.emit() }
    else if (action && !event.repeat) this.action(action)
  }
  private up = (event: KeyboardEvent) => { if (this.held.delete(event.code)) this.emit() }
  private pointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!this.enabled || pointer.wasTouch) return
    if (pointer.rightButtonDown()) this.setHeld('mouse', 'guard', true)
    else if (pointer.leftButtonDown()) this.action('attack')
  }
  private pointerUp = (pointer: Phaser.Input.Pointer) => { if (!pointer.wasTouch) this.releaseMouse() }
  private releaseMouse = () => { this.held.delete('mouse'); this.emit() }
  setHeld(token: string, control: HeldControl, down: boolean) {
    if (!this.enabled && down) return
    if (down) this.held.set(token, control); else this.held.delete(token)
    this.emit()
  }
  action(action: RaceAction) { if (this.enabled) this.bridge.action(action) }
  setEnabled(enabled: boolean) { this.enabled = enabled; if (!enabled) this.release() }
  private emit() {
    const h = new Set(this.held.values())
    this.bridge.move({ x: Number(h.has('right')) - Number(h.has('left')), y: Number(h.has('down')) - Number(h.has('up')), crouch: h.has('crouch'), guard: h.has('guard') })
  }
  release = () => { this.held.clear(); this.bridge.release() }
  destroy() {
    this.release(); this.keyboard?.off('keydown', this.down); this.keyboard?.off('keyup', this.up)
    this.scene.input.off('pointerdown', this.pointerDown); this.scene.input.off('pointerup', this.pointerUp)
    this.scene.input.off('pointerupoutside', this.pointerUp); this.scene.input.off('gameout', this.releaseMouse)
    window.removeEventListener('blur', this.release); document.removeEventListener('visibilitychange', this.release)
  }
}
