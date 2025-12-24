import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../domain/User.js";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "database.sqlite",
      entities: [User],
      synchronize: true, // DEV only
    }),
    TypeOrmModule.forFeature([User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
