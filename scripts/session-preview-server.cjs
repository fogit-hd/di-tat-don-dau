// Disposable local visual preview. No database, real credentials or external services.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {Server}=require('socket.io');const {createFixture}=require('./session-fixtures.cjs');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'frontend/dist'),fixture=createFixture(),clients=new Map();
const toolbar='<div style="position:fixed;bottom:4px;right:4px;z-index:9999;background:#fff1d6;color:#4b170e;padding:6px 10px;font:12px Arial;border:1px solid #ad8439;border-radius:5px;max-width:95vw">Xem thử · dữ liệu mô phỏng: <a href="/preview/lobby">Nhân vật</a> · <a href="/preview/live">Top realtime</a> · <a href="/preview/player">Tổng kết CEO</a> · <a href="/preview/final">Tổng kết host</a></div>';
let io;
function push(){for(const [socket,role]of clients)socket.emit('snapshot',fixture.snapshot(role))}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname.startsWith('/preview/')){const state=url.pathname.split('/').pop();fixture.room.status=state==='lobby'?'lobby':state==='live'?'playing':'ended';fixture.room.endsAt=Date.now()+900000;push();res.writeHead(302,{Location:state==='lobby'||state==='player'?'/play/XTV45':'/host/XTV45'});return res.end()}
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');return res.end('{"ok":true}')}
  if(url.pathname.startsWith('/api/')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};res.setHeader('Content-Type','application/json');
   if(url.pathname.endsWith('/avatar')){const {avatarSchema}=await import('../backend/src/game/avatar.ts');const a=avatarSchema.safeParse(body);if(!a.success||fixture.room.status!=='lobby'){res.statusCode=400;return res.end('{"error":"Diện mạo không hợp lệ"}')}fixture.teams[0].avatar=a.data;push();return res.end(JSON.stringify({avatar:a.data}))}
   if(url.pathname.endsWith('/pause')){fixture.room.status='paused';fixture.room.remainingMs=500000;push()}
   if(url.pathname.endsWith('/resume')){fixture.room.status='playing';fixture.room.endsAt=Date.now()+500000;push()}
   if(url.pathname.endsWith('/end')){fixture.room.status='ended';push()}
   return res.end(JSON.stringify({ok:true,yearMinSeconds:5}));
  }
  if(url.pathname==='/config.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.__APP_CONFIG__={};')}
  let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(dist+path.sep)&&file!==dist){res.statusCode=403;return res.end()}
  if(!path.extname(file))file=path.join(dist,'index.html');if(!fs.existsSync(file)){res.statusCode=404;return res.end()}
  const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[ext]||'application/octet-stream');
  if(ext==='.html'){const init='<script>localStorage.setItem("player:XTV45","local-preview");localStorage.setItem("host:XTV45","local-preview");</script>';return res.end(fs.readFileSync(file,'utf8').replace('</head>',init+'</head>').replace('</body>',toolbar+'</body>'))}
  fs.createReadStream(file).pipe(res);
 }catch(error){res.statusCode=500;res.end(String(error))}
});
io=new Server(server);io.on('connection',socket=>{socket.on('hello',data=>{clients.set(socket,data.role==='host'?'host':'player');push()});socket.on('disconnect',()=>clients.delete(socket))});
server.listen(4521,'127.0.0.1',()=>console.log('Local-only UI preview: http://127.0.0.1:4521/preview/lobby'));
