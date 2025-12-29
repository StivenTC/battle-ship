import { Module } from "@nestjs/common";
import { AuthController } from "./features/auth/auth.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { GameModule } from "./features/game/game.module.js";
import { UsersService } from "./features/users/users.service.js";

@Module({
  imports: [DatabaseModule, GameModule],
  controllers: [AuthController],
  providers: [UsersService], // Keep UsersService provided or export it from a UsersModule (TODO)
})
export class AppModule {}
