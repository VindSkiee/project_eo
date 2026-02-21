import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import morgan from 'morgan'; 
import helmet from 'helmet'; 
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 
import cookieParser from 'cookie-parser'; 
import compression from 'compression'; // <-- IMPORT BARU
import rateLimit from 'express-rate-limit'; // <-- IMPORT BARU
import { json, urlencoded } from 'express'; // <-- IMPORT BARU
import { randomUUID } from 'crypto'; // <-- IMPORT BARU (Bawaan Node.js)
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'; // <-- KITA BUAT NANTI
import { NestExpressApplication } from '@nestjs/platform-express/interfaces/nest-express-application.interface';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // STATIC FILES: Serve /uploads directory for profile images, etc.
  app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 1. SECURITY (Helmet)
  // Menghapus x-powered-by dan menambah header keamanan lainnya
  app.use(helmet());

  // 👇 AKTIFKAN INI AGAR RATE LIMIT MEMBACA IP ASLI USER, BUKAN IP SERVER
  app.set('trust proxy', 1);

  // 2. CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. BODY PARSER LIMIT (Mencegah OOM dari payload raksasa)
  app.use(json({ limit: '2mb' })); // Batas aman 2MB
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  // 4. REQUEST ID MIDDLEWARE (Untuk Traceability)
  app.use((req: any, res: any, next: any) => {
    req.id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', req.id); // Balas ke client
    next();
  });

  // 5. LOGGER (Morgan) dengan injeksi Request ID
  // Format log: [REQ-ID] METHOD URL STATUS - DURASI
  morgan.token('reqId', (req: any) => req.id.split('-')[0]); // Ambil potongan awal UUID agar log rapi
  app.use(morgan('[:reqId] :method :url :status - :response-time ms'));

  // 6. COMPRESSION (Gzip / Brotli)
  // Memperkecil ukuran response body, membuat API terasa lebih cepat di frontend
  app.use(compression());

  // 7. RATE LIMITER (Mencegah Brute-force & DDoS)
  const isProduction = process.env.NODE_ENV === 'production';
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // Jendela waktu: 15 menit
      
      // Jika di Production pakai limit ketat (100). 
      // Jika di Dev/Lokal beri limit sangat besar (5000) agar bebas testing.
      max: isProduction ? rateLimitMax : 5000, 
      
      message: { 
        statusCode: 429, 
        message: 'Terlalu banyak request, mohon coba beberapa saat lagi.' 
      },
    }),
  );

  // 8. COOKIE PARSER
  app.use(cookieParser());

  // 9. GLOBAL PREFIX & TIMEOUT INTERCEPTOR
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new TimeoutInterceptor()); // <-- Cegah API menggantung (Hanging Request)

  // 10. VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 11. SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Project EO API')
    .setDescription('Dokumentasi API untuk Event Organizer App')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📄 Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();