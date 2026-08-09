import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './app.module';

async function purgeDemoData() {
  try {
    const prisma = new PrismaClient();
    console.log('Purging sample demo data from database...');
    
    await prisma.studentProfile.deleteMany({});
    await prisma.staffProfile.deleteMany({
      where: {
        user: {
          current_email: { not: 'admin@school.com' }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        current_email: { not: 'admin@school.com' }
      }
    });
    await prisma.leaveRequest.deleteMany({});
    await prisma.feeInvoice.deleteMany({});

    console.log('Demo data purged! Only Super Admin remains.');
    await prisma.$disconnect();
  } catch (e) {
    console.error('Purge error:', e);
  }
}

async function bootstrap() {
  // One-time startup purge of sample data
  await purgeDemoData();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`School ERP Backend Server is running on: http://localhost:${port}`);
}
bootstrap();
