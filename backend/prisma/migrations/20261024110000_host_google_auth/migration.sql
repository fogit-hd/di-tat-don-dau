ALTER TABLE "Room" ADD COLUMN "hostUserId" TEXT;
ALTER TABLE "Room" ADD COLUMN "report" JSONB;

CREATE TABLE "HostUser" (
  "id" TEXT NOT NULL,
  "googleSub" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "picture" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HostUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HostUser_googleSub_key" ON "HostUser"("googleSub");
CREATE UNIQUE INDEX "HostUser_email_key" ON "HostUser"("email");
CREATE TABLE "HostSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "HostSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HostSession_tokenHash_key" ON "HostSession"("tokenHash");
CREATE INDEX "HostSession_userId_idx" ON "HostSession"("userId");
CREATE INDEX "HostSession_expiresAt_idx" ON "HostSession"("expiresAt");
CREATE INDEX "Room_hostUserId_idx" ON "Room"("hostUserId");
ALTER TABLE "HostSession" ADD CONSTRAINT "HostSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "HostUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "HostUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
