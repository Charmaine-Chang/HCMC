import { Module } from '@nestjs/common';
import { ApiController } from './routes';
import { ApiService } from './service';
import { Db } from './db';

@Module({controllers:[ApiController],providers:[Db,ApiService]})
export class AppModule {}
