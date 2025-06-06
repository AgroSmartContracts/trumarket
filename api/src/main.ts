import './instrument';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as schedule from 'node-schedule';
import * as webpush from 'web-push';

import { AppModule } from './app.module';
import { config } from './config';
import { ErrorsFilter } from './errors.filter';
import { syncDealsLogs } from './jobs/syncDealsLogs';
import { logger } from './logger';

webpush.setVapidDetails(
  'mailto:' + config.mailTo,
  config.vapidPublicKey,
  config.vapidPrivateKey,
);

async function bootstrap() {
  logger.info('Starting server...');
  const app = await NestFactory.create(AppModule);

  let docsPrefix = 'docs';

  if (process.env.NODE_ENV === 'production') {
    app.setGlobalPrefix('api/v2');
    docsPrefix = 'api/v2/docs';
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TruMarket Shipment API')
    .setVersion('1.1')
    .addTag('TruMarket')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(docsPrefix, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  if (process.env.E2E_TEST) {
    app.useLogger(false);
  } else {
    app.useLogger(app.get(Logger));
  }

  app.enableCors();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ErrorsFilter(httpAdapter));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeUnsetFields: false,
        excludeExtraneousValues: true,
      },
    }),
  );

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      excludeExtraneousValues: true,
    }),
  );

  schedule.scheduleJob('* * * * *', syncDealsLogs);

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
