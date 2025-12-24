import { Module } from "@nestjs/common";
import { GameGateway } from "./gateways/game.gateway.js";

@Module({
  imports: [],
  controllers: [],
  providers: [GameGateway],
})
export class AppModule {}
