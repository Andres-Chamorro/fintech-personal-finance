import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BudgetsModule } from './modules/budgets/budgets.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (100 requests per 15 minutes)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '900000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
  ],
})
export class AppModule {}
