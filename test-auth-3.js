const { PrismaClient } = require("@prisma/client");
async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ 
    where: { email: "admin@logivox.ai" }
  });
  console.log("isActive:", user.isActive);
}
test();
