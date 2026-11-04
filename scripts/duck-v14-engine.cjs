const fs=require('node:fs'),path=require('node:path');const file=path.resolve(__dirname,'../backend/src/games/duck-race/engine.ts');let s=fs.readFileSync(file,'utf8');
s=s.replace('STEP_PX, LANE_OFFSETS, LANE_Y, WORLD, terrainAt, obstaclePoint, beamHeight','STEP_PX, ROAD_Y, ROAD_HALF_WIDTH, WORLD, terrainAt, obstaclePoint');
s=s.replace('spawnObstacles, obstacleCollision','spawnObstacles, obstacleCollision, clearsObstacle');
s=s.replace('finishedAt?: number;', 'finishedAt?: number; capturedAt?:number; capturedBy?:string;');
s=s.replaceAll('courseVersion:2','courseVersion:3').replaceAll('room.courseVersion===2','room.courseVersion===3').replaceAll('room.courseVersion=2','room.courseVersion=3');
s=s.replace('LANE_OFFSETS[room.players.length%3]', '(room.players.length*37%140)-70');
s=s.replace("function question(p: Racer)", "function ensureActive(p:Racer){if(p.capturedAt)throw new RaceError('Vịt đã bị bắt. Điểm đã chốt; bạn có thể xem cuộc đua tiếp tục.')}\nfunction question(p: Racer)");
s=s.replaceAll('ensureRacing(room, now)\n', 'ensureRacing(room, now); ensureActive(p)\n');
s=s.replace('if (!timeout) ensureRacing(room, now)', 'if (!timeout) ensureRacing(room, now); ensureActive(p)');
s=s.replaceAll('ensureRacing(room,now)\n', 'ensureRacing(room,now);ensureActive(p)\n');
s=s.replace('ensureRacing(room,now);if', 'ensureRacing(room,now);ensureActive(p);if');
s=s.replace("if (room.phase !== 'racing') return\n  if (![x", "if (room.phase !== 'racing'||p.capturedAt) return\n  if (![x");
s=s.replace("q.id!==p.id&&!q.finishedAt", "q.id!==p.id&&!q.finishedAt&&!q.capturedAt");
s=s.replace('filter(x => x.id !== p.id)', 'filter(x => x.id !== p.id&&!x.capturedAt)');
s=s.replace("// Damaging weather may reuse a blocked lane, never the reserved opening.","// Damaging weather stays on an already blocked footprint, preserving its walk-around gap.");
s=s.replace("const worldX=anchor?.worldX??randomInt(900,WORLD-1000),lane=(anchor?.lane??randomInt(3)) as 0|1|2\n      const worldY=LANE_Y[lane]\n      room.hazards.push({id:randomUUID(),worldX,worldY,lane,rowId:anchor?.rowId,freeLane:anchor?.freeLane,", "const worldX=anchor?.worldX??randomInt(900,WORLD-1000)\n      const worldY=anchor?.worldY??ROAD_Y+randomInt(-60,61)\n      room.hazards.push({id:randomUUID(),worldX,worldY,spanY:Math.min(24,anchor?.spanY??24),thicknessX:24,rowId:anchor?.rowId,");
s=s.replace('const p = room.players[i]\n', 'const p = room.players[i]\n    if(p.capturedAt){p.speed=0;p.rolling=false;continue}\n');
s=s.replace("const hp=obstaclePoint(h,now),contact=obstacleCollision(from,p,h,now,dt)!==null\n      const avoids=['hurdle','rock','boulder'].includes(h.kind)&&flightHeight(p,now)>18||h.kind==='gate'&&p.crouching||h.kind==='beam'&&(p.crouching||beamHeight(h,now)>65||flightHeight(p,now)>beamHeight(h,now)+16)\n      if(contact&&!avoids)", `if(h.caughtRacerId)continue
      const hp=obstaclePoint(h,now)
      if(h.kind==='catcher'&&Math.abs(hp.x-p.x)<260&&Math.abs(hp.y-p.y)<(h.spanY??40)/2+25&&!h.alertedAt)h.alertedAt=now
      const contact=obstacleCollision(from,p,h,now,dt)
      const avoids=clearsObstacle(p,h,now-dt*1000+(contact??1)*dt*1000)
      if(contact!==null&&!avoids&&h.kind==='catcher'&&!p.shield){
        p.capturedAt=now;p.capturedBy=h.id;h.caughtRacerId=p.id;h.caughtAt=now
        p.x=hp.x;p.y=hp.y;p.progress=p.x/STEP_PX;p.target=p.progress;p.speed=0;p.rolling=false;p.rollRemaining=0
        p.inputX=p.inputY=p.inputUntil=p.jumpUntil=0;p.guardHeld=false;p.jumpQueued=false;p.starArmed=false;p.stake=0
        log(room,p,'Bị người bắt vịt tóm trong lưới. Chốt '+p.points+' điểm; kết thúc lượt của bạn.','collision',now)
        break
      }
      if(contact!==null&&!avoids)`);
s=s.replace('finishedAt: p.finishedAt,', 'finishedAt: p.finishedAt, capturedAt:p.capturedAt,capturedBy:p.capturedBy,');
s=s.replace("p && q && room.phase === 'racing'", "p && !p.capturedAt && q && room.phase === 'racing'");
fs.writeFileSync(file,s);
console.log('Continuous ground footprints and per-player capture settlement installed.');
