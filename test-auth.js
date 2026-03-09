const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: "admin@logivox.ai" } });
  console.log("User:", user ? "Found" : "Not Found");
  if (user) {
    const isValid = await bcrypt.compare("Admin@Logivox1!", user.password);
    console.log("Password valid:", isValid);
  }
}
test();
