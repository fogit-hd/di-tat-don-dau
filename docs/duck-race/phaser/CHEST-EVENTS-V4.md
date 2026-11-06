# Rương V4 — danh mục sự kiện

72 sự kiện: 16 An toàn, 24 Bán phẩm, 32 Bùng nổ. Trong đó 20 sự kiện chuyển điểm giữa các nhóm. Mỗi lần chọn rương, máy chủ bốc một sự kiện trong loại rương đó và một số nguyên trong khoảng của sự kiện.

## Quy tắc chuyển điểm

- Lấy điểm: nhóm chịu tác động chuyển điểm cho nhóm mở rương. Tặng/chia điểm: nhóm mở rương chuyển điểm cho nhóm chịu tác động.
- Chỉ chọn nhóm khác khi chuyển điểm. Không có nhóm khác thì kết quả 0 điểm, không kẹt ở bước chọn mục tiêu.
- Mỗi lượt trừ tối đa 80 điểm và 20% số điểm bên trả đang có. Tổng chuyển trong một sự kiện nhiều nhóm tối đa 160 điểm; quỹ chia sẻ của người mở còn bị giới hạn 20% điểm trước khi chia. Số lượng thực tế được làm tròn xuống số nguyên.
- Bảo hộ chặn một lần lấy điểm; bên nhận không được cộng nếu bên trả không bị trừ. Không có điểm thì không chuyển.
- Điểm bên nhận bằng đúng điểm thực tế bên trả mất, có lịch sử cho cả hai. Không thu/cộng lại khi gửi trùng yêu cầu hoặc kết thúc trận.

## Danh mục


### An toàn — 16

- **Lương thực dự trữ** (`supplies`): bản thân, cộng/trừ điểm, khoảng [20, 35].

- **Học bổng** (`scholarship`): bản thân, cộng/trừ điểm, khoảng [15, 30].

- **Nhà tài trợ** (`sponsor`): bản thân, cộng/trừ điểm, khoảng [35, 50].

- **Khoản tiết kiệm** (`savings`): bản thân, cộng/trừ điểm, khoảng [25, 40].

- **Bảo hộ** (`shield`): bản thân, thêm bảo hộ, khoảng [1, 1].

- **Khuyến học** (`next-bonus`): bản thân, thưởng câu đúng kế tiếp, khoảng [15, 30].

- **Quỹ dự phòng** (`reserve`): bản thân, cộng/trừ điểm, khoảng [30, 45].

- **Hoàn phí** (`refund`): bản thân, cộng/trừ điểm, khoảng [20, 40].

- **Giao hàng đúng hẹn** (`delivery`): bản thân, cộng/trừ điểm, khoảng [25, 45].

- **Sáng kiến nhỏ** (`invention`): bản thân, cộng/trừ điểm, khoảng [30, 55].

- **Phiếu tiếp sức** (`voucher`): bản thân, cộng/trừ điểm, khoảng [15, 45].

- **Thu gom đổi thưởng** (`recycling`): bản thân, cộng/trừ điểm, khoảng [20, 50].

- **Sổ tay kiến thức** (`reading`): bản thân, thưởng câu đúng kế tiếp, khoảng [25, 45].

- **Luyện tập hiệu quả** (`practice`): bản thân, thưởng câu đúng kế tiếp, khoảng [30, 50].

- **Bảo hiểm hành trình** (`insurance`): bản thân, thêm bảo hộ, khoảng [1, 1].

- **Thưởng cột mốc** (`milestone`): bản thân, cộng/trừ điểm, khoảng [35, 60].


### Bán phẩm — 24

- **Quà bất ngờ** (`gift`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [25, 45].

- **Phí kiểm định** (`fee`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-35, -15].

- **Tiếp sức cá nhân** (`support`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [30, 50].

- **Thất lạc hành lý** (`loss`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-40, -20].

- **Bảo hộ ngẫu nhiên** (`shield`): một nhóm ngẫu nhiên, thêm bảo hộ, khoảng [1, 1].

- **Cơ hội học tập** (`learning`): một nhóm ngẫu nhiên, thưởng câu đúng kế tiếp, khoảng [20, 35].

- **Hóa đơn phát sinh** (`bill`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-45, -25].

- **Phần thưởng may mắn** (`reward`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [30, 45].

- **Móc túi bất ngờ** (`pickpocket`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [20, 40].

- **Thu phí đi đường** (`toll`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [15, 35].

- **Nhận hoa hồng** (`commission`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [25, 45].

- **Thương lượng có lợi** (`trade-win`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [30, 50].

- **Chia sẻ lương thực** (`share`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [-35, -15].

- **Quà gửi bạn đường** (`gift-away`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [-45, -25].

- **Bồi thường va chạm** (`compensate`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [-40, -20].

- **Tài trợ bạn đồng hành** (`sponsor-other`): một nhóm ngẫu nhiên, chuyển điểm, khoảng [-50, -30].

- **Nhặt được túi điểm** (`found-purse`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [35, 60].

- **Rách túi dự trữ** (`damaged-bag`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-50, -20].

- **Vé thưởng ngẫu nhiên** (`lucky-ticket`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [20, 60].

- **Lỡ chuyến giao hàng** (`missed-delivery`): một nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-40, -15].

- **Bí quyết từ bạn đường** (`quiz-tip`): một nhóm ngẫu nhiên, thưởng câu đúng kế tiếp, khoảng [30, 50].

- **Suất ôn tập đặc biệt** (`study-group`): một nhóm ngẫu nhiên, thưởng câu đúng kế tiếp, khoảng [25, 45].

- **Cứu trợ kịp lúc** (`rescue`): một nhóm ngẫu nhiên, thêm bảo hộ, khoảng [1, 1].

- **Đồng xu định mệnh** (`coin-toss`): một nhóm ngẫu nhiên, ngẫu nhiên cộng hoặc trừ, khoảng [25, 50].


### Bùng nổ — 32

- **Tiếp sức toàn phòng** (`public-grant`): toàn phòng, cộng/trừ điểm, khoảng [20, 35].

- **Phí toàn phòng** (`public-fee`): toàn phòng, cộng/trừ điểm, khoảng [-30, -15].

- **Quà liên minh** (`alliance`): 2–3 nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [35, 55].

- **Sự cố liên hoàn** (`interruption`): 2–3 nhóm ngẫu nhiên, cộng/trừ điểm, khoảng [-40, -20].

- **Tài trợ chỉ định** (`chosen-gift`): một nhóm chỉ định, cộng/trừ điểm, khoảng [40, 60].

- **Phí chỉ định** (`chosen-fee`): một nhóm chỉ định, cộng/trừ điểm, khoảng [-50, -30].

- **Làn sóng tăng trưởng** (`growth`): toàn phòng, cộng/trừ điểm, khoảng [25, 40].

- **Đợt thu phí bất ngờ** (`crisis`): toàn phòng, cộng/trừ điểm, khoảng [-35, -20].

- **Bảo hộ liên minh** (`protection`): 2–3 nhóm ngẫu nhiên, thêm bảo hộ, khoảng [1, 1].

- **Thương vụ táo bạo** (`risk`): bản thân, ngẫu nhiên cộng hoặc trừ, khoảng [35, 60].

- **Áp lực dẫn đầu** (`leader`): nhóm dẫn đầu, cộng/trừ điểm, khoảng [-45, -25].

- **Cơ hội bám đuổi** (`catch-up`): nhóm cuối bảng, cộng/trừ điểm, khoảng [40, 60].

- **Lấy điểm chỉ định** (`chosen-steal`): một nhóm chỉ định, chuyển điểm, khoảng [35, 65].

- **Thu phí người dẫn đầu** (`leader-steal`): nhóm dẫn đầu, chuyển điểm, khoảng [40, 70].

- **Gom điểm toàn phòng** (`crowd-collection`): toàn phòng, chuyển điểm, khoảng [15, 35].

- **Thu phí liên minh** (`alliance-tax`): 2–3 nhóm ngẫu nhiên, chuyển điểm, khoảng [25, 45].

- **Tặng điểm chỉ định** (`chosen-give`): một nhóm chỉ định, chuyển điểm, khoảng [-65, -35].

- **Tiếp sức người bám đuổi** (`last-give`): nhóm cuối bảng, chuyển điểm, khoảng [-60, -30].

- **Chia quỹ toàn phòng** (`public-share`): toàn phòng, chuyển điểm, khoảng [-30, -15].

- **Góp quỹ đồng minh** (`alliance-share`): 2–3 nhóm ngẫu nhiên, chuyển điểm, khoảng [-45, -25].

- **Phí bản quyền công nghệ** (`royalty`): 2–3 nhóm ngẫu nhiên, chuyển điểm, khoảng [30, 50].

- **Hoa hồng thị trường** (`public-commission`): toàn phòng, chuyển điểm, khoảng [20, 40].

- **Hợp đồng độc quyền** (`chosen-contract`): một nhóm chỉ định, chuyển điểm, khoảng [45, 75].

- **Thu hồi khoản ứng trước** (`last-collection`): nhóm cuối bảng, chuyển điểm, khoảng [20, 40].

- **Ngày hội thưởng điểm** (`festival`): toàn phòng, cộng/trừ điểm, khoảng [30, 50].

- **Biến động thị trường** (`market-shock`): 2–3 nhóm ngẫu nhiên, ngẫu nhiên cộng hoặc trừ, khoảng [30, 60].

- **Phong trào học tập** (`public-study`): toàn phòng, thưởng câu đúng kế tiếp, khoảng [15, 30].

- **Bí kíp liên minh** (`alliance-study`): 2–3 nhóm ngẫu nhiên, thưởng câu đúng kế tiếp, khoảng [25, 45].

- **Thử thách người dẫn đầu** (`leader-study`): nhóm dẫn đầu, thưởng câu đúng kế tiếp, khoảng [30, 50].

- **Lá chắn bám đuổi** (`last-shield`): nhóm cuối bảng, thêm bảo hộ, khoảng [1, 1].

- **Bảo hộ chỉ định** (`chosen-shield`): một nhóm chỉ định, thêm bảo hộ, khoảng [1, 1].

- **Canh bạc chỉ định** (`chosen-risk`): một nhóm chỉ định, ngẫu nhiên cộng hoặc trừ, khoảng [35, 65].


Với chuyển điểm: khoảng dương là lấy về người mở; khoảng âm là người mở tặng đi. Các khoảng là yêu cầu trước giới hạn; giao diện và lịch sử hiển thị số thực tế. Phạm vi chuyển điểm luôn loại chính người mở.
