#!/usr/bin/env node
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const UNIT_LIST = [
  { code: "DBP",  name: "Điện lực Điện Biên Phủ" },
  { code: "TG",   name: "Điện lực Tuần Giáo" },
  { code: "TA",   name: "Điện lực Thanh An" },
  { code: "NS",   name: "Điện lực Na Sang" },
  { code: "NSN",  name: "Điện lực Na Son" },
  { code: "TCH",  name: "Điện lực Tủa Chùa" },
  { code: "MA",   name: "Điện lực Mường Ảng" },
  { code: "MN",   name: "Điện lực Mường Nhé" },
  { code: "XNCT", name: "Xí nghiệp Cao thế" },
  { code: "PXPD", name: "Phân xưởng phát điện" },
  { code: "KHN",  name: "Khách hàng ngoài" },
];

const url = process.env.DATABASE_URL || "file:./dev.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const adapter = new PrismaLibSql({
  url,
  authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const u of UNIT_LIST) {
    await prisma.unit.upsert({
      where: { code: u.code },
      update: { name: u.name },
      create: u,
    });
    console.log(`[seed] Unit ${u.code} — ${u.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
