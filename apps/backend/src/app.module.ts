import { Module } from "@nestjs/common";
import { AuthController } from "./features/auth/auth.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { GameModule } from "./features/game/game.module.js";
import { UsersModule } from "./features/users/users.module.js";

@Module({
  imports: [DatabaseModule, GameModule, UsersModule],
  controllers: [AuthController],
  providers: [],
})
export class AppModule {}
