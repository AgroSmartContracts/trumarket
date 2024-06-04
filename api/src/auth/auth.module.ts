import { Module } from '@nestjs/common';

import { DealsModule } from '@/deals/deals.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { UsersModule } from '@/users/users.module';

import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsersService, UsersRepository],
  imports: [UsersModule, DealsModule, NotificationsModule],
})
export class AuthModule {}
