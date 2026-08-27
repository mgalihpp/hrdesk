import { prisma } from "../lib/prisma";

async function main() {
  console.log("seed: nothing to seed yet");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
