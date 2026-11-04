# Quiz Duck Race — đường chạy ngang

> Bản v10 dưới đây là lịch sử thiết kế. Luật hiện tại đã bỏ tự đi và dùng 3 làn vật cản; xem [WORLD-COORDINATES-v11.md](WORLD-COORDINATES-v11.md).

Áp dụng prompt mới nhất: tự tiến từ trái sang phải, né lên/xuống liên tục trong giới hạn; **không có làn**. Nhảy là độ cao riêng, không làm đổi tọa độ mặt đất.

- Thế giới: X = 0 → 60.000 px; dải né Y = 444 → 556, tâm 500.
- `DuckMotor.speedSlow` = 96 px/s; `speedBoost` = 390 px/s. Trang bị, bùn/nước và thời tiết có thể điều chỉnh tốc độ.
- W/S hoặc ↑/↓: né; A/D: điều chỉnh nhịp tiến 0,5×/1,5×, không quay cả cuộc đua thành chạy ngược.
- Đi chậm không tốn điểm. Gói 50 điểm mua 600 px bứt tốc; gói 150 điểm mua 2.400 px. Máy chủ kiểm tra/trừ điểm; quãng đường dự trữ tự dùng, không cần giữ hướng.
- Hết quãng đường bứt tốc: trở về đi chậm ngay cả trong phần cuối của một tick. Choáng tạm dừng di chuyển; không xóa quãng đường đã mua.
- Vật cản được sinh theo seed riêng của phòng, gắn với % đường đua, tồn tại cố định. Chỉ tạo sprite trong vùng camera. Môi trường xuất hiện mỗi 30 giây, tồn tại 10 giây.
- Va chạm quét cả đoạn chuyển động tương đối của vịt và vật cản (swept AABB). Bứt tốc không xuyên vật cản. Nhảy vượt vật thấp; cúi qua thanh thấp; hoặc né khỏi vùng tiếp xúc.
- Va chạm không được bảo vệ: ngất/choáng 1,5 giây, lùi lại trước vật cản; miễn nhiễm ngắn và chớp trắng khi phục hồi. Không tự ý phạt thêm điểm.

## Nguồn triển khai

`shared/duck-motor.ts`: `DuckMotor`, `spawnObstacles`, `obstacleCollision` — mã thuần, không chứa renderer/socket/global state. Script `sync-duck-contracts.cjs` tạo bản tương ứng trong hai Docker context. `backend/src/duck-race/engine.ts` sở hữu luật và tiền; `frontend/src/duck-race/motion.ts` dự đoán bằng cùng công thức. `RaceTrack.tsx` chỉ hiển thị và phát frame đã vẽ.

## Ví dụ JavaScript/PixiJS tối giản

Ví dụ minh họa vòng lặp cục bộ; game thật chạy bước vật lý và trừ điểm ở máy chủ. Các module TypeScript dưới đây được Vite biên dịch thành JavaScript.

```js
import {Application, Container, Assets, AnimatedSprite, Sprite} from 'pixi.js';
import {DuckMotor, spawnObstacles, obstacleCollision} from './motor';
import {trackPoint, ROAD_Y} from './track';

const app = new Application();
await app.init({resizeTo: mount, background: '#183b2a'});
mount.appendChild(app.canvas);
const world = new Container({sortableChildren: true});
app.stage.addChild(world); // Mỗi màn hình sở hữu world/ticker/camera riêng.

const sheet = await Assets.load('/assets/duck-race/ducks-v9.json');
const duck = new AnimatedSprite(sheet.animations['duckee/yellow/walk_run']);
duck.anchor.set(.5, .75); duck.scale.set(3.2); duck.animationSpeed = .16;
duck.play(); world.addChild(duck);
const motor = new DuckMotor();
let state = {x: 0, y: ROAD_Y, reserve: 0, crouching: false, airborne: false};
const input = {x: 0, y: 0}; // W/S hoặc nút cảm ứng cập nhật y trong [-1,1].
const hazards = spawnObstacles(12345);
const rock = await Assets.load('/assets/duck-race/world-v8/hurdle.webp');
for (const h of hazards) {
  const object = new Sprite(rock); // Bản thật chọn asset tương ứng từng kind.
  object.anchor.set(.5, 1);
  Object.assign(object.position, trackPoint(h.position, h.offset));
  world.addChild(object);
}

// Minh họa cục bộ. Production: buyMove() thực hiện các kiểm tra này ở backend.
let points = 200, stunnedUntil = 0;
boostButton.addEventListener('click', () => {
  if (points < 150) return;
  points -= 150;
  state.reserve += 2400;
});

app.ticker.add(ticker => {
  const now = performance.now(), dt = Math.min(.05, ticker.deltaMS / 1000);
  if (now >= stunnedUntil) {
    const next = motor.advance(state, input, dt);
    const hit = hazards.find(h => obstacleCollision(state, next, h, now, dt) !== null);
    if (hit) {
      stunnedUntil = now + 1500;
      state.x = Math.max(0, trackPoint(hit.position).x - 260);
    } else state = {...state, ...next};
  }
  duck.position.set(state.x, state.y);
  // Camera bám X, giữ đường chân trời cố định khi né/jump.
  world.x += (app.screen.width*.35-state.x-world.x)*(1-Math.exp(-12*dt));
  world.y = app.screen.height*.68-ROAD_Y;
});
```

Production còn xử lý jump/crouch, khiên, thứ tự va chạm, recoil và miễn nhiễm phục hồi trong `engine.ts`; không cho client tự gửi tọa độ, điểm hoặc kết quả va chạm.

## Ranh giới hai game

- Duck: `frontend/src/duck-race`, `backend/src/duck-race`, `/assets/duck-race`.
- Đi Tắt Đón Đầu giữ engine và asset riêng. Không game nào import module của game kia.
- UI cơ bản, trang chọn game và factory tạo socket độc lập: `frontend/src/shared`.
- Câu hỏi và đọc cấu hình môi trường dùng chung: `backend/src/shared`.
- `node scripts/check-game-boundaries.cjs` kiểm tra import chéo và renderer singleton.
- Shared không giữ Application, ticker, World Container hay kết nối socket toàn cục.
