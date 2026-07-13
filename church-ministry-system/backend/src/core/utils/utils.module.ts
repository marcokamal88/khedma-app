import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScopeUtils } from './scope-utils';
import { Class } from '../../modules/church/entities/class.entity';
import { StageGroup } from '../../modules/church/entities/stage-group.entity';
import { Service } from '../../modules/church/entities/service.entity';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Class, StageGroup, Service])],
  providers: [ScopeUtils],
  exports: [ScopeUtils],
})
export class UtilsModule {}
