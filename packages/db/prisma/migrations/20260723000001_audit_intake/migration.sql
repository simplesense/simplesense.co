-- CreateEnum
CREATE TYPE "AuditIntakeStatus" AS ENUM ('NEW', 'CONTACTED', 'DELIVERED', 'DECLINED');

-- CreateTable
CREATE TABLE "AuditIntake" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AuditIntakeStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditIntake_module_idx" ON "AuditIntake"("module");

-- CreateIndex
CREATE INDEX "AuditIntake_status_idx" ON "AuditIntake"("status");
