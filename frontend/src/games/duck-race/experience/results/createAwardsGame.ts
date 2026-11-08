import Phaser from 'phaser';
import { actorPose, awardLayout, awardPad, awardSchedule, phaseAt, SHEETS, type AwardPhase, type ResultPlayer, type Sheet } from './motion';
import { silverMotion } from './silver-motion';
import { bronzeMotion } from './bronze-motion';
import { cosmeticItems } from '../../experience-contracts';
import { awardApparelUrl } from '../wardrobe-art';
const ROOT = '/assets/duck-race/', ART = ROOT + 'results-v1/';
export type AwardsInput = {
    players: readonly ResultPlayer[];
    reduced: boolean;
    paused: boolean;
    replay: number;
};
export type AwardsFrame = {
    phase: AwardPhase;
    revealed: number[];
    layout: ReturnType<typeof awardLayout>;
    done: boolean;
};
type Hooks = {
    ready: () => void;
    frame: (state: AwardsFrame) => void;
    error: (message: string) => void;
};
type Actor = {
    player: ResultPlayer;
    body: Phaser.GameObjects.Image;
    shadow: Phaser.GameObjects.Ellipse;
    dressed: Map<string, string>;
};
const finalistSheets = (rank: number): Sheet[] => rank === 1
    ? ['winner-parachute', 'winner-stow', 'winner-coronation', 'winner-crowned-idle']
    : rank === 2 ? ['silver-swing'] : ['bronze-skate'];
const posesFor = (rank: number) => [
    ...finalistSheets(rank).map(name => ({ name, ...SHEETS[name] })),
    ...(rank === 1 ? [{ name: 'idle', frames: 4, cell: 64, columns: 4, anchorY: 48 }] : []),
];
class AwardsScene extends Phaser.Scene {
    private read: () => AwardsInput;
    private hooks: Hooks;
    private elapsed = 0;
    private replay = 0;
    private failed = false;
    private actors: Actor[] = [];
    private cups?: Phaser.GameObjects.Image;
    private lastState = '';
    private rope?: Phaser.GameObjects.Graphics;
    private board?: Phaser.GameObjects.Image;
    private ramp?: Phaser.GameObjects.Image;
    constructor(read: () => AwardsInput, hooks: Hooks) { super('DuckAwards'); this.read = read; this.hooks = hooks; }
    preload() {
        this.load.on('loaderror', () => { if (!this.failed) {
            this.failed = true;
            this.hooks.error('Không tải được hoạt ảnh trao giải. Vui lòng thử lại.');
        } });
        this.load.image('cups', ART + 'trophy-cups.webp');
        if (this.read().players.some(player => player.rank === 3)) {
            this.load.image('bronze-ramp', ART + 'bronze-ramp.png');
            this.load.spritesheet('bronze-board', ART + 'bronze-board.png', { frameWidth: 64, frameHeight: 16 });
        }
        this.load.atlas('native', ROOT + 'experience-v4/native.png', ROOT + 'experience-v4/native.json');
        const keys = new Set<string>();
        for (const p of this.read().players.filter(p => p.rank <= 3)) {
            const sheets = finalistSheets(p.rank);
            for (const key of sheets) {
                const id = p.color + '/' + key;
                if (keys.has(id))
                    continue;
                keys.add(id);
                this.load.spritesheet(id, ART + id + '.png', { frameWidth: SHEETS[key].cell, frameHeight: SHEETS[key].cell });
            }
            for (const item of cosmeticItems(p.cosmetics)) {
                for (const pose of posesFor(p.rank)) {
                    const id = `wardrobe/${item}/${pose.name}`;
                    if (keys.has(id)) continue;
                    keys.add(id);
                    this.load.spritesheet(id, awardApparelUrl(item,pose.name), { frameWidth: pose.cell, frameHeight: pose.cell });
                }
            }
        }
    }
    create() {
        if (this.failed)
            return;
        for (const key of this.textures.getTextureKeys())
            if (key !== 'cups')
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.cups = this.add.image(0, 0, 'cups').setOrigin(0);
        if (this.textures.exists('bronze-board')) {
            this.ramp = this.add.image(0, 0, 'bronze-ramp').setOrigin(0).setDepth(.5).setVisible(false);
            this.board = this.add.image(0, 0, 'bronze-board').setOrigin(.5, 14 / 16).setDepth(1.4).setVisible(false);
        }
        this.rope = this.add.graphics().setDepth(1.5);
        this.actors = this.read().players.filter(p => p.rank <= 3).map(player => ({ player,
            shadow: this.add.ellipse(0, 0, 20, 3.6, 0x071c11, .22).setDepth(1),
            body: this.add.image(0, 0, 'native', player.color + '/idle/0').setVisible(false).setDepth(2),
            dressed: this.dress(player) }));
        this.game.canvas.setAttribute('aria-hidden', 'true');
        this.game.canvas.dataset.engine = 'phaser-4.2.1';
        this.hooks.ready();
        this.paint();
    }
    private dress(player: ResultPlayer) {
        const keys = new Map<string, string>();
        const items = cosmeticItems(player.cosmetics);
        if (!items.length) return keys;
        for (const pose of posesFor(player.rank)) {
            const key = `dressed/${player.id}/${pose.name}`;
            const texture = this.textures.createCanvas(key, pose.columns * pose.cell, Math.ceil(pose.frames / pose.columns) * pose.cell)!;
            const context = texture.context;
            context.imageSmoothingEnabled = false;
            for (let frame = 0; frame < pose.frames; frame++) {
                const source = pose.name === 'idle'
                    ? this.textures.getFrame('native', `${player.color}/${pose.name}/${frame}`)
                    : this.textures.getFrame(`${player.color}/${pose.name}`, frame);
                const layers = [source, ...items.map(item => this.textures.getFrame(`wardrobe/${item}/${pose.name}`, frame))];
                const x = frame % pose.columns * pose.cell, y = Math.floor(frame / pose.columns) * pose.cell;
                for (const layer of layers) context.drawImage(layer.source.image as HTMLImageElement,
                    layer.cutX, layer.cutY, layer.cutWidth, layer.cutHeight,
                    x, y, pose.cell, pose.cell);
                texture.add(frame, 0, x, y, pose.cell, pose.cell);
            }
            texture.refresh();
            texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            keys.set(pose.name, key);
        }
        return keys;
    }
    private drawRope(motion: ReturnType<typeof silverMotion>, scale: number) {
        const rope = this.rope!;
        if (!motion.ropeVisible) return;
        rope.setAlpha(motion.ropeAlpha);
        for (const [width, colour] of [[scale * 1.1, 0x44321e], [scale * .58, 0xd8bd7a]]) {
            rope.lineStyle(width, colour).beginPath().moveTo(motion.pivotX, motion.pivotY).lineTo(motion.endX, motion.endY).strokePath();
        }
        const length = Math.hypot(motion.endX - motion.pivotX, motion.endY - motion.pivotY);
        const count = Math.max(1, Math.ceil(length / (scale * 2.5)));
        rope.lineStyle(scale * .32, 0x8c693c);
        for (let i = 0; i < count; i++) {
            const from = i / count, to = Math.min(1, from + .6 / count);
            rope.beginPath().moveTo(motion.pivotX + (motion.endX - motion.pivotX) * from, motion.pivotY + (motion.endY - motion.pivotY) * from)
                .lineTo(motion.pivotX + (motion.endX - motion.pivotX) * to, motion.pivotY + (motion.endY - motion.pivotY) * to).strokePath();
        }
        if (!motion.attached) {
            rope.fillStyle(0x493a23).fillRect(motion.endX - 12 * scale, motion.endY + scale, 24 * scale, 4 * scale);
            rope.fillStyle(0xc29859).fillRect(motion.endX - 11 * scale, motion.endY + scale, 22 * scale, 2 * scale);
        }
    }
    private drawBoard(motion: ReturnType<typeof bronzeMotion>, age: number, scale: number) {
        this.ramp?.setVisible(motion.rampVisible)
            .setPosition(motion.rampX, motion.rampY)
            .setRotation(motion.angle)
            .setDisplaySize(Math.max(.01, motion.rampLength), 6 * scale);
        this.board?.setVisible(motion.boardVisible)
            .setPosition(motion.boardX, motion.boardY)
            .setRotation(motion.angle)
            .setScale(scale)
            .setFrame(Math.floor(age / 38) % 12);
    }
    update(_clock: number, delta: number) {
        if (this.failed || !this.cups)
            return;
        const input = this.read(), schedule = awardSchedule(input.players);
        if (this.replay !== input.replay) {
            this.replay = input.replay;
            this.elapsed = 0;
        }
        if (input.reduced)
            this.elapsed = schedule.total;
        else if (!input.paused && !document.hidden)
            this.elapsed = Math.min(schedule.total, this.elapsed + Math.min(80, delta));
        this.paint();
    }
    private paint() {
        const input = this.read(), s = awardSchedule(input.players), t = this.elapsed, w = this.scale.width, h = this.scale.height, l = awardLayout(w, h);
        const intro = input.reduced ? 1 : Math.min(1, t / 550);
        this.cups?.setPosition(l.ix, l.iy + (1 - intro) * 18).setDisplaySize(l.iw, l.ih).setAlpha(intro);
        const revealed: number[] = [];
        this.rope?.clear();
        this.board?.setVisible(false);
        this.ramp?.setVisible(false);
        for (const a of this.actors) {
            const rank = a.player.rank, pose = actorPose(rank, t, s), pad = awardPad(rank, l);
            a.body.setVisible(pose.visible).setAlpha(pose.alpha).setRotation(0);
            a.shadow.setVisible(pose.visible && (rank !== 3 || pose.landed));
            if (!pose.visible)
                continue;
            if (pose.landed)
                revealed.push(rank);
            a.shadow.setPosition(pad.x, pad.y + 1).setScale(l.scale).setAlpha(.22 * (!pose.landed ? pose.p : 1));
            if (a.dressed.has(pose.key))
                a.body.setTexture(a.dressed.get(pose.key)!, pose.frame);
            else if (pose.key === 'idle')
                a.body.setTexture('native', `${a.player.color}/${pose.key}/${pose.frame}`);
            else
                a.body.setTexture(`${a.player.color}/${pose.key}`, pose.frame);
            a.body.setOrigin(.5, pose.anchorY / pose.cell).setScale(l.scale);
            let x = pad.x, y = pad.y + pose.offset * l.scale;
            if (rank === 1 && !pose.landed) {
                const descent = 1 - (1 - pose.p) ** 1.35;
                y = -90 + (pad.y + 90) * descent;
                x += Math.sin(pose.p * Math.PI * 3) * (1 - pose.p) * l.scale * 5;
            }
            if (rank === 2 && !input.reduced) {
                const motion = silverMotion(t - s.starts[rank], pad.x, pad.y, l.scale, h);
                x = motion.x; y = motion.y;
                this.drawRope(motion, l.scale);
            }
            if (rank === 3 && !input.reduced) {
                const age = t - s.starts[rank];
                const motion = bronzeMotion(age, pad.x, pad.y, l.scale, w);
                this.drawBoard(motion, age, l.scale);
                // Match the reviewed rotation around wheel contact, rather than
                // rotating around the image's different, fixed atlas anchor.
                const dx = motion.bodyX - motion.pivotX;
                const dy = motion.bodyY - motion.pivotY;
                const cosine = Math.cos(motion.bodyAngle), sine = Math.sin(motion.bodyAngle);
                x = motion.pivotX + dx * cosine - dy * sine;
                y = motion.pivotY + dx * sine + dy * cosine;
                a.body.setRotation(motion.bodyAngle);
            }
            a.body.setPosition(x, y);
        }
        const phase = phaseAt(t, s), done = t >= s.total, key = [phase, revealed.join(','), w, h, done].join('|');
        this.game.canvas.dataset.awardPhase = phase;
        if (this.lastState !== key) {
            this.lastState = key;
            this.hooks.frame({ phase, revealed, layout: l, done });
        }
    }
}
export function createAwardsGame(parent: HTMLElement, read: () => AwardsInput, hooks: Hooks) {
    return new Phaser.Game({ type: Phaser.AUTO, parent, banner: false, transparent: true, antialias: true, autoFocus: false, disableContextMenu: true,
        scale: { mode: Phaser.Scale.RESIZE, width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight), expandParent: false },
        fps: { target: 60, smoothStep: true }, audio: { noAudio: true }, input: { keyboard: false }, scene: new AwardsScene(read, hooks) });
}
