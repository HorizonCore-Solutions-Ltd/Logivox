const { PrismaClient } = require("@prisma/client");
async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: "admin@logivox.ai" },
    include: { securityProfile: true },
  });
  console.log(user.securityProfile);
}
test();
