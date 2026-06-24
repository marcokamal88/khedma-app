import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TaioController } from './taio.controller';
import { TaioService } from './taio.service';
import { TaioTransaction } from './entities/taio-transaction.entity';
import { StoreItem } from './entities/store-item.entity';
import { StoreRedemption } from './entities/store-redemption.entity';

@Module({
  imports: [SequelizeModule.forFeature([TaioTransaction, StoreItem, StoreRedemption])],
  controllers: [TaioController],
  providers: [TaioService],
  exports: [TaioService],
})
export class TaioModule {}
