ALTER TABLE "Room" ALTER COLUMN "yearMinSeconds" SET DEFAULT 5;
ALTER TABLE "Room" ADD COLUMN "linePrices" JSONB;

ALTER TABLE "GameEvent" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GameEvent" ADD COLUMN "trait" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HeirOutcome" ADD COLUMN "multiplierMin" DOUBLE PRECISION;
ALTER TABLE "HeirOutcome" ADD COLUMN "multiplierMax" DOUBLE PRECISION;

UPDATE "HeirOutcome" SET
  weight = 1,
  "multiplierMin" = CASE "outcomeType"
    WHEN 'bankrupt' THEN 0
    WHEN 'squander' THEN 0.4
    WHEN 'steady' THEN 1
    WHEN 'prosper' THEN 1.2
    WHEN 'double' THEN 2
    ELSE "multiplier"
  END,
  "multiplierMax" = CASE "outcomeType"
    WHEN 'bankrupt' THEN 0
    WHEN 'squander' THEN 0.9
    WHEN 'steady' THEN 1
    WHEN 'prosper' THEN 2
    WHEN 'double' THEN 3
    ELSE "multiplier"
  END;

CREATE TABLE "SuccessionPolicy" (
    "id" TEXT NOT NULL,
    "baseChance" DOUBLE PRECISION NOT NULL,
    "stepPerYear" DOUBLE PRECISION NOT NULL,
    "maxChance" DOUBLE PRECISION NOT NULL,
    "longevityChance" DOUBLE PRECISION NOT NULL,
    "illnessAdd" DOUBLE PRECISION NOT NULL,
    "traitRules" JSONB NOT NULL,

    CONSTRAINT "SuccessionPolicy_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SuccessionPolicy" ("id", "baseChance", "stepPerYear", "maxChance", "longevityChance", "illnessAdd", "traitRules")
VALUES (
  'default',
  0.03,
  0.03,
  0.30,
  0.01,
  0.10,
  '{"heir_trained":{"outcome":"prosper","add":3},"inheritance_dispute":{"outcome":"squander","add":3},"family_fund":{"outcome":"bankrupt","set":0},"heir_abroad":{"outcome":"double","add":3}}'::jsonb
);

INSERT INTO "TraitCopy" ("id", "label", "detail", "sort") VALUES
  ('longevity', 'Trường thọ', 'Chủ xưởng sống lâu. Nguy cơ qua đời cố định 1% mỗi năm.', 1),
  ('illness', 'Bạo bệnh', 'Chủ xưởng mang bệnh nặng. Nguy cơ qua đời tăng thêm 10 điểm phần trăm mỗi năm.', 2),
  ('heir_trained', 'Người kế nghiệp được đào tạo', 'Đời sau dễ phát đạt hơn khi nhận xưởng.', 3),
  ('inheritance_dispute', 'Tranh chấp thừa kế', 'Con cháu dễ phá gia chi tử khi chia xưởng.', 4),
  ('family_fund', 'Quỹ gia tộc', 'Gia đình có quỹ dự phòng, nên chuyển giao không còn phá sản.', 5),
  ('life_insurance', 'Bảo hiểm nhân thọ', 'Khi chủ qua đời, xưởng nhận thêm một khoản tiền.', 6),
  ('heir_abroad', 'Con du học về nước', 'Người thừa kế có thêm cơ hội nhân đôi tài sản.', 7)
ON CONFLICT ("id") DO NOTHING;
