import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const sslMode = process.env.AIVEN_DB_SSL_MODE;

        return {
          dialect: 'mysql',
          host: isProduction ? process.env.AIVEN_DB_HOST : config.get<string>('database.host'),
          port: isProduction ? parseInt(process.env.AIVEN_DB_PORT || '3306', 10) : config.get<number>('database.port'),
          database: isProduction ? process.env.AIVEN_DB_NAME : config.get<string>('database.name'),
          username: isProduction ? process.env.AIVEN_DB_USER : config.get<string>('database.user'),
          password: isProduction ? process.env.AIVEN_DB_PASS : config.get<string>('database.pass'),
          autoLoadModels: true,
          synchronize: false,
          logging: false,
          define: {
            underscored: true,
            paranoid: false,
            timestamps: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
          },
          pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
          },
          ...(sslMode === 'REQUIRED' && {
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: true,
              },
            },
          }),
        };
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
