import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { GameGateway } from "./gateways/game.gateway.js";
import { GameManagerService } from "./services/game-manager.service.js";
import { UsersService } from "./services/users.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [GameGateway, UsersService, GameManagerService],
})
export class AppModule {}
