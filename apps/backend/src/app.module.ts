import { Module } from "@nestjs/common";
import { AuthController } from "./features/auth/auth.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { GameGateway } from "./features/game/game.gateway.js";
import { GameManagerService } from "./features/game/game-manager.service.js";
import { UsersService } from "./features/users/users.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [GameGateway, UsersService, GameManagerService],
})
export class AppModule {}
