// One-off, explicit migration. Source edits are anchored and fail on unexpected input.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
function edit(p,a,b){const s=read(p);if(!s.includes(a))throw Error('Anchor missing: '+p+' '+a.slice(0,60));write(p,s.replace(a,b))}
const runtime='backend/src/games/di-tat-don-dau/runtime.ts';
let s=read(runtime);s=s.replace(/export class HttpError extends Error \{[\s\S]*?\n\}\n/,"import { HttpError } from '../../shared/http-error'\nexport { HttpError } from '../../shared/http-error'\n");write(runtime,s);
edit('backend/src/shared/auth.ts',"'../games/di-tat-don-dau/runtime'","'./http-error'");
fs.appendFileSync(path.join(root,'backend/src/shared/auth.ts'),`\nexport async function revokeHostSession(token: string) {\n  const { secret } = config()\n  if (token) await prisma.hostSession.deleteMany({ where: { tokenHash: tokenHash(token, secret) } })\n}\n`);
const server='backend/src/games/di-tat-don-dau/server.ts';
s=read(server).replace('requireHostUser, signInGoogle','requireHostUser, signInGoogle, revokeHostSession');
if(!s.includes("revokeHostSession }"))s=s.replace('signInGoogle, requireHostUser','signInGoogle, requireHostUser, revokeHostSession');
const at=s.indexOf("app.get('/api/auth/me'");s=s.slice(0,at)+`app.post('/api/auth/logout', async (req, res, next) => {\n  try { await revokeHostSession(hostSession(req)); res.json({ ok: true }) } catch(error) { next(error) }\n})\n\n`+s.slice(at);write(server,s);
const start='frontend/src/games/di-tat-don-dau/components/StartScreen.tsx';s=read(start);
s=s.replace('GoogleHostLogin, type GoogleIdentity','GoogleHostLogin');
s="import { useHostAuth } from '../../../shared/auth/useHostAuth'\nimport { GameWebBar } from '../../../shared/ui/GameWebBar'\n"+s;
s=s.replace("const [hostSession, setHostSession] = useState(() => localStorage.getItem('host-session') || '')","const { token: hostSession, setToken: setHostSession, logout } = useHostAuth()");
s=s.replace(/<header className="public-header public-wrap"[\s\S]*?<\/header>/,`<GameWebBar theme="wine" logo="/assets/landing-v2/brand-logo.webp" home="/di-tat-don-dau" title="Đi Tắt Đón Đầu" signedIn={!!hostSession} busy={busy}
        links={[{label:'Chọn game',to:'/'},{label:'Cách chơi',to:'/wiki?section=start'},{label:'Sự kiện',to:'/wiki?section=events'},{label:'Wiki',to:'/wiki'}]}
        onCreate={()=>{setError('');loginIntent.current='create';hostSession?setHostOpen(true):setLoginOpen(true)}}
        onAccount={()=>{if(hostSession){void logout().then(()=>setHostOpen(false)).catch(e=>setError(e.message))}else{loginIntent.current='login';setLoginOpen(true)}}}/>`);
s=s.replace("localStorage.setItem('host-session',token)","");
s=s.replace(/onLogout=\{\(\)=>\{localStorage.removeItem\('host-session'\);[\s\S]*?disableAutoSelect\?\.\(\)\}\}/,"onLogout={()=>{void logout().then(()=>setHostOpen(false)).catch(e=>setError(e.message))}}");write(start,s);
const login='frontend/src/shared/auth/GoogleHostLogin.tsx';s=read(login).replace('({ intent, onSuccess, onClose }','({ intent, onSuccess, onClose, brand }').replace("intent: 'create' | 'login'; onSuccess:","brand?: { src: string; title: string }; intent: 'create' | 'login'; onSuccess:");s=s.replace('src="/assets/landing-v2/brand-logo.webp" alt="Đi Tắt Đón Đầu"','src={brand?.src || "/assets/landing-v2/brand-logo.webp"} alt={brand?.title || "Đi Tắt Đón Đầu"}');write(login,s);
const pkg='backend/package.json';s=read(pkg).replaceAll('src/duck-race/server.ts','src/games/duck-race/server.ts');write(pkg,s);
const duckserver='backend/src/games/duck-race/server.ts';s=read(duckserver);s="import { requireHostUser } from '../../shared/auth'\nimport { HttpError } from '../../shared/http-error'\n"+s;s=s.replace("route(async (_req, res) => {\n  if (rooms.size", "route(async (req, res) => {\n  await requireHostUser(req.header('x-host-session') || '')\n  if (rooms.size");s=s.replace('if (err instanceof RaceError) return','if (err instanceof RaceError || err instanceof HttpError) return');write(duckserver,s);
edit('backend/Dockerfile.duck','COPY prisma/seed/presentation-questions.ts ./prisma/seed/presentation-questions.ts','COPY prisma ./prisma\nRUN npx prisma generate');
const dq='frontend/src/games/duck-race/DuckRace.tsx';s=read(dq);s="import { useHostAuth } from '../../shared/auth/useHostAuth'\nimport { GoogleHostLogin } from '../../shared/auth/GoogleHostLogin'\nimport { GameWebBar } from '../../shared/ui/GameWebBar'\n"+s;
s=s.replace('...(token ? { \'x-duck-token\': token } : {})',"...(token ? { 'x-duck-token': token } : {}), ...(localStorage.getItem('host-session') ? { 'x-host-session': localStorage.getItem('host-session')! } : {})");
s=s.replace("const [guide,setGuide]=useState(true)","const { token:hostSession, setToken:setHostSession, logout } = useHostAuth()\n  const [loginOpen,setLoginOpen]=useState(false), loginIntent=useRef<'create'|'login'>('login')\n  const [guide,setGuide]=useState(true)");
s=s.replace("async function create() {\n    setBusy", "async function create(verified=false) {\n    if(!hostSession&&!verified){loginIntent.current='create';setLoginOpen(true);return}\n    setBusy");
s=s.replace('<header className="dq-nav">',`{!code ? <GameWebBar theme="forest" logo="/assets/duck-race/lettering-ai-v5/brand-title.svg" home="/duck-race" title="Quiz Duck Race" signedIn={!!hostSession} busy={busy}
      links={[{label:'Chọn game',to:'/'},{label:'Cách chơi',onClick:()=>setRules(true)}]}
      onCreate={()=>void create()} onAccount={()=>{if(hostSession){void logout().catch(e=>setError(e.message))}else{loginIntent.current='login';setLoginOpen(true)}}}/> : <header className="dq-nav">`);
s=s.replace('</header>\n    {error','</header>}\n    {loginOpen&&<GoogleHostLogin brand={{src:"/assets/duck-race/lettering-ai-v5/brand-title.svg",title:"Quiz Duck Race"}} intent={loginIntent.current} onClose={()=>setLoginOpen(false)} onSuccess={({token})=>{setHostSession(token);setLoginOpen(false);if(loginIntent.current===\'create\')void create(true)}}/>}\n    {error');
s=s.replace('onClick={create}', 'onClick={()=>void create()}');write(dq,s);
// Shared navigation assets have neutral ownership; neither game imports another game's source or artwork.
const out=path.join(root,'frontend/public/assets/shared/webbar');fs.mkdirSync(out,{recursive:true});
for(const name of ['frame-field','frame-action'])fs.copyFileSync(path.join(root,'frontend/public/assets/duck-race/v14',name+'.svg'),path.join(out,name+'.svg'));
fs.copyFileSync(path.join(root,'frontend/public/assets/landing-v2/wine.webp'),path.join(out,'wine.webp'));
fs.copyFileSync(path.join(root,'frontend/public/assets/duck-race/materials-v4/forest.svg'),path.join(out,'forest.svg'));
const css='frontend/src/shared/ui/game-web-bar.css';s=read(css).replace('/assets/landing-v2/red-texture.webp','/assets/shared/webbar/wine.webp').replace('/assets/duck-race/materials-v4/forest.svg','/assets/shared/webbar/forest.svg').replaceAll('/assets/duck-race/v14/','/assets/shared/webbar/');write(css,s);
console.log('Shared account, navbar and isolated server entry points updated.');
