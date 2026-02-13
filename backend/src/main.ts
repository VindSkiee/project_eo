import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import morgan from 'morgan'; // Logger HTTP
import helmet from 'helmet'; // Security Headers
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Dokumentasi API
import cookieParser from 'cookie-parser'; // <-- 1. Import ini

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. SECURITY (Helmet)
  // Melindungi header HTTP dari serangan umum
  app.use(helmet());

  // 2. LOGGER (Morgan)
  // Mencatat setiap request yang masuk ke terminal (Method, URL, Status, Durasi)
  app.use(morgan('dev'));

  // 3. GLOBAL PREFIX
  app.setGlobalPrefix('api');

  // 2. Gunakan Cookie Parser
  app.use(cookieParser());

  // 4. CORS (Updated)
  // Pastikan origin sesuai dengan frontend Anda
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Tambahkan variasi IP
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 5. VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
      transformOptions: {
        enableImplicitConversion: true, // Otomatis convert string query param ke number/boolean
      },
    }),
  );

  // 6. SWAGGER (Dokumentasi API Otomatis)
  // Akses di: http://localhost:3000/api/docs
  const config = new DocumentBuilder()
    .setTitle('Project EO API')
    .setDescription('Dokumentasi API untuk Event Organizer App')
    .setVersion('1.0')
    .addBearerAuth() // Tambahkan tombol "Authorize" (Input Token)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📄 Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();