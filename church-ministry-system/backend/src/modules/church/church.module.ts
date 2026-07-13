import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChurchController } from './church.controller';
import { ChurchService } from './church.service';
import { Sector } from './entities/sector.entity';
import { Service } from './entities/service.entity';
import { StageGroup } from './entities/stage-group.entity';
import { Class } from './entities/class.entity';
import { TaioModule } from '../taio/taio.module';
import { MemberRole } from '../users/entities/member-role.entity';

@Module({
  imports: [SequelizeModule.forFeature([Sector, Service, StageGroup, Class, MemberRole]), TaioModule],
  controllers: [ChurchController],
  providers: [ChurchService],
  exports: [ChurchService],
})
export class ChurchModule {}
