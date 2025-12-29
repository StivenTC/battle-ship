import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway.js";
import { GameManagerService } from "./game-manager.service.js";
import { UsersService } from "../users/users.service.js"; // Dependency

@Module({
  providers: [GameGateway, GameManagerService, UsersService],
  exports: [GameManagerService],
})
export class GameModule {}
