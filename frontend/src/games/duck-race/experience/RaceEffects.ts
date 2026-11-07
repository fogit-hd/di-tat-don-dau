import Phaser from 'phaser';
import type { EventFX } from '../experience-contracts';
import { WIND_IMPACT_MS } from '../score-motion';
import { LIGHTNING_MS, boltGeometry } from './race-fx-layout';
type Effect = {
    key: string;
    target: string;
    kind: EventFX;
    at: number;
    x: number;
    y: number;
    direction: number;
};
const ROOT = '/assets/duck-race/experience-v6/';
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
/** Painted cel playback, with screen-space entry paths and a bounded reusable sprite pool. */
export class RaceEffects {
    private scene: Phaser.Scene;
    private pool: Phaser.GameObjects.Image[] = [];
    private cursor = 0;
    private active: Effect[] = [];
    private used = new Set<string>();
    private anchors = new Map<string, {
        x: number;
        y: number;
    }>();
    static preload(scene: Phaser.Scene) {
        for (const kind of ['lightning', 'wind', 'shield', 'rain', 'dust-air'])
            for (let frame = 0; frame < 6; frame++) {
                scene.load.image(`racefx-${kind}-${frame}`, `${ROOT}fx/${kind}/${frame}.webp`);
            }
    }
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        for (let frame = 0; frame < 6; frame++) {
            scene.textures.get(`racefx-lightning-${frame}`).add('bolt', 0, 104, 120, 288, 296);
            scene.textures.get(`racefx-rain-${frame}`).add('drops', 0, 0, 0, 512, 394);
            scene.textures.get(`racefx-rain-${frame}`).add('splash', 0, 0, 394, 512, 82);
        }
    }
    follow(id: string, x: number, y: number) { this.anchors.set(id, { x, y }); }
    trigger(key: string, kind: EventFX, at: number, x: number, y: number, delta: number, target = '') {
        const identity = (kind === 'rain' || kind === 'dust' ? `${kind}:${at}` : key);
        if (this.used.has(identity))
            return;
        this.used.add(identity);
        if (this.used.size > 256)
            this.used = new Set([...this.used].slice(-128));
        this.active.push({ key: identity, target, kind, at, x, y, direction: delta > 0 ? 1 : -1 });
        // Ambient cels accompany existing events without adding score penalties.
        if (kind === 'lightning')
            this.trigger(`rain:${at}`, 'rain', at, x, y, delta);
        if (kind === 'wind')
            this.trigger(`dust:${at}`, 'dust', at, x, y, delta);
    }
    begin(now: number, width: number, height: number, reduced: boolean, road: [
        number,
        number
    ]) {
        this.cursor = 0;
        this.active = this.active.filter(effect => now - effect.at < (effect.kind === 'lightning' ? 700 : 3900));
        for (const effect of this.active) {
            const age = Math.max(0, now - effect.at);
            const target = this.anchors.get(effect.target) || effect;
            if (effect.kind === 'lightning') {
                const visibleMs = reduced ? 700 : LIGHTNING_MS;
                if (age >= visibleMs)
                    continue;
                const rect = boltGeometry(target.x, target.y, height, width < 600 ? 2.15 : 2.7);
                const phase = reduced ? .4 : age < 16 ? .2 : .2 + clamp((age - 16) / 164) * .8;
                const alpha = reduced ? .25 : age < 48 ? 1 : clamp((LIGHTNING_MS - age) / (LIGHTNING_MS - 48)) ** 2;
                this.frames('lightning', phase, rect.x, rect.y, rect.width, rect.height, alpha, 0, 0, 'bolt');
            }
            else if (effect.kind === 'wind') {
                const size = Math.min(300, height * .8), start = effect.direction < 0 ? width + size * .6 : -size * .6;
                const x = reduced ? target.x : start + (target.x - start) * age / WIND_IMPACT_MS;
                this.frames('wind', reduced ? .4 : clamp(age / 2600 * 1.5), x, target.y, size, size, age > 2800 ? clamp((3900 - age) / 1100) : 1, .5, .72, undefined, effect.direction < 0);
            }
            else if (effect.kind === 'rain') {
                const life = age / 3900, envelope = Math.min(1, age / 300, (1 - life) * 5);
                for (let i = 0; i < (reduced ? 6 : 22); i++) {
                    const x = ((i * .6180339) % 1) * width, y = reduced ? height * .4 : ((i * .17 + age / 1400) % 1) * height;
                    const size = clamp(width * .12, 80, 170);
                    this.frames('rain', ((age / 900 + i * .13) % 1), x, y, size, size * 394 / 512, envelope * .7, .5, .5, 'drops');
                    if (i < 8)
                        this.frames('rain', ((age / 650 + i * .17) % 1), x, height * (road[0] + (road[1] - road[0]) * (.15 + (i * .237) % .7)), size, size * 82 / 512, envelope * .65, .5, .5, 'splash');
                }
            }
            else if (effect.kind === 'dust') {
                for (let i = 0; i < (reduced ? 3 : 6); i++) {
                    const size = clamp(width * .3, 180, 360), offset = size * .6 + i * width * .065 - age / 1000 * width * .48;
                    const x = reduced ? (i + .5) * width / 3 : effect.direction < 0 ? width + offset : -offset;
                    this.frames('dust-air', clamp(age / 3900 * 1.1 - i * .015), x, height * (.55 + (i * .117) % .36), size, size, Math.min(1, age / 300, (3900 - age) / 700) * .5);
                }
            }
        }
    }
    shield(x: number, y: number, scale: number, now: number, reduced: boolean) {
        const size = scale * 69;
        this.frames('shield', reduced ? .5 : (now % 2800) / 2800, x, y - scale * 3, size, size, .8);
    }
    end() { for (let i = this.cursor; i < this.pool.length; i++)
        this.pool[i].setVisible(false); }
    private frames(kind: string, phase: number, x: number, y: number, width: number, height: number, alpha: number, originX = .5, originY = .72, frameName?: string, flipX = false) {
        const progress = clamp(phase, 0, .9999) * 5, first = Math.floor(progress), mix = progress - first;
        for (const [frame, weight] of [[first, 1 - mix], [Math.min(5, first + 1), mix]]) {
            let image = this.pool[this.cursor++];
            if (!image) {
                image = this.scene.add.image(0, 0, `racefx-${kind}-${frame}`);
                this.pool.push(image);
            }
            image.setTexture(`racefx-${kind}-${frame}`, frameName).setFlipX(flipX).setOrigin(originX, originY).setPosition(x, y).setDisplaySize(width, height).setDepth(9500).setAlpha(clamp(alpha) * weight).setVisible(true);
        }
    }
    destroy() { for (const image of this.pool)
        image.destroy(); this.pool = []; this.active = []; this.anchors.clear(); }
}
