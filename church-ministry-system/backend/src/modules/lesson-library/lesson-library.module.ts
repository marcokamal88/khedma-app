import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LessonLibraryController } from './lesson-library.controller';
import { LessonLibraryService } from './lesson-library.service';
import { Lesson } from './entities/lesson.entity';

@Module({
  imports: [SequelizeModule.forFeature([Lesson])],
  controllers: [LessonLibraryController],
  providers: [LessonLibraryService],
  exports: [LessonLibraryService],
})
export class LessonLibraryModule {}
