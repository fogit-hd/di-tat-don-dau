import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { RaceScene } from './scenes/RaceScene'
import { InputController } from './bridge/InputController'
import { SimulationBridge } from './bridge/SimulationBridge'

export function createRaceGame(parent: HTMLElement, bridge: SimulationBridge, callbacks: {
  progress: (value: number) => void; error: (message: string) => void; ready: (input: InputController) => void
}) {
  return new Phaser.Game({
    type: Phaser.AUTO, parent, title: 'Quiz Duck Race · Phaser V1', banner: false,
    backgroundColor: '#baddde', antialias: true, roundPixels: false,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight, expandParent: false },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60 } },
    fps: { target: 60, smoothStep: true }, audio: { noAudio: true }, autoFocus: false,
    input: { activePointers: 4, keyboard: true, mouse: true, touch: true }, disableContextMenu: true,
    scene: [new BootScene(callbacks.progress, callbacks.error), new RaceScene(bridge, callbacks.ready)],
  })
}
