
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // Create Admin user
  const adminEmail = 'admin@example.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: 'password', // In a real app, always hash passwords!
        role: 'ADMIN',
      },
    });
    console.log(`Created admin user with id: ${admin.id}`);
  } else {
    console.log(`Admin user with email ${adminEmail} already exists.`);
  }

  // Create regular user
  const userEmail = 'user@example.com';
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: userEmail,
        password: 'password', // In a real app, always hash passwords!
        role: 'USER',
      },
    });
    console.log(`Created user with id: ${user.id}`);
  } else {
    console.log(`User with email ${userEmail} already exists.`);
  }

  // Create default 'Walk-in Customer' counterparty for POS
  const posClientName = 'Walk-in Customer';
  let posClient = await prisma.counterparty.findFirst({ where: { name: posClientName }});
  if (!posClient) {
      posClient = await prisma.counterparty.create({
          data: {
              name: posClientName,
              email: 'pos@example.com',
              types: 'CLIENT',
          }
      });
      console.log(`Created 'Walk-in Customer' with id: ${posClient.id}`);
  } else {
      console.log(`'Walk-in Customer' already exists.`);
  }

  // Create default 'Cash Drawer' wallet for POS
  const cashWalletName = 'Cash Drawer';
  let cashWallet = await prisma.wallet.findUnique({ where: { name: cashWalletName }});
  if (!cashWallet) {
    cashWallet = await prisma.wallet.create({
      data: {
        name: cashWalletName,
        balance: 100.00, // Start with some cash
      }
    });
    console.log(`Created '${cashWalletName}' wallet with id: ${cashWallet.id}`);
  } else {
    console.log(`'${cashWalletName}' wallet already exists.`);
  }

  // Create default 'Main Bank Account' wallet
  const bankWalletName = 'Main Bank Account';
  let bankWallet = await prisma.wallet.findUnique({ where: { name: bankWalletName }});
  if (!bankWallet) {
    bankWallet = await prisma.wallet.create({
      data: {
        name: bankWalletName,
        balance: 5000.00,
      }
    });
    console.log(`Created '${bankWalletName}' wallet with id: ${bankWallet.id}`);
  } else {
    console.log(`'${bankWalletName}' wallet already exists.`);
  }


  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
