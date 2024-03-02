import { NestFactory, Reflector, HttpAdapterHost } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module';
import { ErrorsFilter } from './errors.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Opsin API')
    .setDescription('The Opsin API description')
    .setVersion('1.0')
    .addTag('Opsin')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)

  app.useLogger(app.get(Logger))

  const httpAdapter = app.get(HttpAdapterHost)
  app.useGlobalFilters(new ErrorsFilter(httpAdapter))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeUnsetFields: false,
        excludeExtraneousValues: true,
      },
    }),
  )

  const reflector = app.get(Reflector)

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      excludeExtraneousValues: true,
    }),
  )

  await app.listen(3000);
}
bootstrap();
