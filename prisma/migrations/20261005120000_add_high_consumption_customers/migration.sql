-- CreateTable
CREATE TABLE IF NOT EXISTS "HighConsumptionCustomer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dviqlyCode" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "commune" TEXT,
    "consumptionKwh" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "phone" TEXT,
    "customerType" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HighConsumptionCustomer_customerCode_key" ON "HighConsumptionCustomer"("customerCode");
CREATE INDEX IF NOT EXISTS "HighConsumptionCustomer_dviqlyCode_idx" ON "HighConsumptionCustomer"("dviqlyCode");
CREATE INDEX IF NOT EXISTS "HighConsumptionCustomer_commune_idx" ON "HighConsumptionCustomer"("commune");
CREATE INDEX IF NOT EXISTS "HighConsumptionCustomer_customerType_idx" ON "HighConsumptionCustomer"("customerType");
CREATE INDEX IF NOT EXISTS "HighConsumptionCustomer_consumptionKwh_idx" ON "HighConsumptionCustomer"("consumptionKwh");
