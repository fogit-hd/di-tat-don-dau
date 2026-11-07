// Dev-only fixture renders the production component; no room or auth state is mocked.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HostResults } from './HostResults';
import type { RaceSnapshot, RacerView } from '../../contracts';
import { DUCK_COLORS } from '../../contracts';
import '../experience.css';
const longNames = [
    'Nhóm Khát Vọng Chinh Phục Đỉnh Cao',
    'CA\u0302U LA\u0323C BO\u0323 NHU\u031b\u0303NG CHIE\u0302\u0301N BINH',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
    'Các Nhà Sáng Lập Đầy Nhiệt Huyết',
    'Đội Những Chú Vịt Không Bỏ Cuộc',
    'Nhóm Chiến Lược Gia Thế Hệ Mới',
    'Gia Đình Vịt Vàng Siêu Bứt Phá',
];
export function Preview() {
    const [count, setCount] = useState(7), [reduced, setReduced] = useState(false), [long, setLong] = useState(new URLSearchParams(window.location.search).get('names') === 'long'), [seed, setSeed] = useState(0);
    const players = Array.from({ length: count }, (_, i) => ({ id: 'group-' + i, rank: i + 1, name: long ? longNames[i] : 'Nhóm ' + (i + 1), color: DUCK_COLORS[(i + seed) % DUCK_COLORS.length], model: 'duckee', cosmetics: {glasses: i%2?'dark':'brass',scarf:i%2?'teal':'red'}, points: 2150 - i * 215, correct: 12 - i, answered: 20, connected: true })) as RacerView[];
    const snapshot: RaceSnapshot = { code: 'DEVTEST', mode: 'quiz-v4', phase: 'finished', serverTime: 1, startedAt: 0, endsAt: 480000, duration: 480000, players, hazards: [], logs: Array.from({ length: 23 }, (_, i) => ({ id: 'log-' + i, kind: 'card', text: `Nhóm ${(i % 7) + 1} nhận được ${i * 5 + 10} điểm từ rương.`, at: i })), questionCount: 20, finishReason: 'time', storage: 'memory' };
    return <main className="q4-shell q4-room-shell"><header className="q4-room-header q4-hud is-results"><img src="/assets/duck-race/lettering-ai-v5/brand-title.webp" alt="Quiz Duck Race" style={{ width: 110, height: 65, objectFit: 'contain' }}/><div><strong>Tổng kết cuộc đua</strong><span>Kiểm thử · {count} nhóm</span></div><div className="q4-fixture-controls" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'end', fontSize: 11 }}><label>Số nhóm <select aria-label="Số nhóm" value={count} onChange={e => setCount(Number(e.target.value))}>{[0, 1, 2, 3, 7].map(n => <option key={n}>{n}</option>)}</select></label><label><input type="checkbox" checked={long} onChange={e => setLong(e.target.checked)}/>Tên dài</label><label><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)}/>Giảm chuyển động</label><button onClick={() => setSeed(s => s + 1)}>Đổi màu</button></div></header><HostResults key={`${count}:${long}:${seed}`} snapshot={snapshot} reduced={reduced}/></main>;
}
if (import.meta.env.DEV)
    createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><Preview /></BrowserRouter></StrictMode>);
