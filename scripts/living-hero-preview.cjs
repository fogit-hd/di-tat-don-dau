// Read-only local landing preview. No room creation, credentials or live database.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const dist=path.resolve(__dirname,'../frontend/dist');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/health'||url.pathname==='/api/setup'){
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,yearMinSeconds:5}));
 }
 if(url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Bản xem thử giao diện chưa kết nối máy chủ trò chơi'}))}
 if(url.pathname==='/config.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.__APP_CONFIG__={};')}
 let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(dist+path.sep)&&file!==dist){res.statusCode=403;return res.end()}
 if(!path.extname(file))file=path.join(dist,'index.html');
 if(!fs.existsSync(file)){res.statusCode=404;return res.end()}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
}).listen(4523,'127.0.0.1',()=>console.log('Landing preview: http://127.0.0.1:4523/'));
