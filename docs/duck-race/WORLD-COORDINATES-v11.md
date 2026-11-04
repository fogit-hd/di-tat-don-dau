# Quiz Duck Race — tọa độ world và đường tránh

Vịt chỉ di chuyển khi có phím hoặc nút hướng được giữ. Thả hướng, mất focus, mở bảng câu hỏi hoặc hết hạn tín hiệu điều khiển thì đứng yên. Không tự đi, kể cả sau khi mua bứt tốc hay khi nhảy tại chỗ. WASD/mũi tên hỗ trợ tiến, lùi và né lên/xuống liên tục.

World dài 60.000 px, xuất phát X=0; đích X=60.000. Tâm đường Y=500; giới hạn né Y=416…584. Ba tâm làn đặt vật cản: **444, 500, 556**. Đây là vị trí phân bố vật cản; vịt vẫn di chuyển liên tục giữa chúng.

Mỗi hàng có X cố định được bốc từ seed của phòng khi tạo bản đồ. Mỗi hàng chọn một `freeLane`, rồi đặt 1–2 vật cản vào các làn khác. `worldX`, `worldY`, `rowId`, `lane` và `freeLane` được lưu trong trạng thái phòng. Các hàng cách nhau ít nhất 420 px. Không lấy tọa độ vịt để đặt vật cản. Đá không chạy qua lại theo Y. Mưa/gió cũng dùng tọa độ world; lốc gây va chạm chỉ được đặt vào một ô vốn đã bị chặn để không lấp đường tránh.

Hitbox của vật cản có làn mở rộng theo dấu chân vịt là 18 px trên Y; khoảng cách hai làn là 56 px. Vì vậy toàn bộ bề rộng 56 px của làn trống đều có thể đi qua. `obstacleCollision()` kiểm tra **cả đoạn di chuyển trong world**, không dùng X của camera, pixel màn hình hay chỉ vị trí cuối tick. Bứt tốc không xuyên vật cản. Nhảy/cúi/khiên và phản ứng khi va chạm vẫn do engine xử lý.

Tốc độ đi thường 96 px/s, bứt tốc 390 px/s (trước điều chỉnh trang bị/địa hình). Gói 50 điểm mua 600 px; gói 150 điểm mua 2.400 px. Chỉ tiêu quãng bứt tốc khi giữ hướng tiến. Đứng yên, chỉ đổi Y hoặc đi lùi giữ nguyên quãng đã mua. Trừ điểm chỉ diễn ra ở máy chủ.

Mã chính: `shared/duck-track.ts` định nghĩa hình học/làn; `shared/duck-motor.ts` chứa `DuckMotor.advance()`, `spawnObstacles()` và `obstacleCollision()`. Engine backend quản lý tiền và va chạm; frontend dự đoán cùng công thức và chỉ dịch World Container để theo camera. `node scripts/sync-duck-contracts.cjs` sinh module trong hai Docker context riêng.

```ts
const motor = new DuckMotor();
const hazards = spawnObstacles(roomSeed); // Một lần; không nhận duck.x.
let state = {x: 0, y: LANE_Y[1], reserve: 0, crouching: false, airborne: false};

function update(dt: number, now: number, held: {x: number; y: number}) {
  const next = motor.advance(state, held, dt); // held={0,0}: đứng yên.
  const hit = hazards.find(h => obstacleCollision(state, next, h, now, dt) !== null);
  if (hit) return; // Engine thật còn xử lý jump/crouch/shield và choáng/lùi.
  state = {...state, ...next};
  duck.position.set(state.x, state.y);
  for (const h of hazards) {
    obstacleSprites.get(h.id)!.position.set(h.worldX!, h.worldY!);
  }
  camera.updateCamera({id: 'me', x: state.x, y: state.y, boosting: next.boosting},
    app.screen.width, app.screen.height, world.scale.x);
}
```

Trong game nhiều người, backend chạy bước vật lý và client nội suy snapshot. Không cho client gửi điểm, worldX của vật cản hoặc kết quả va chạm. Hai game vẫn không import chéo hoặc dùng chung renderer/ticker.
