import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway.js";
import { GameManagerService } from "./game-manager.service.js";
import { UsersModule } from "../users/users.module.js";

@Module({
  imports: [UsersModule],
  providers: [GameGateway, GameManagerService],
  exports: [GameManagerService],
})
export class GameModule {}
