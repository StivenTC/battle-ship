import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import type { Repository } from "typeorm";
import { User } from "../domain/User.js";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(username: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      username,
      passwordHash,
    });

    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async addWin(id: string) {
    await this.usersRepository.increment({ id }, "wins", 1);
  }

  async addLoss(id: string) {
    await this.usersRepository.increment({ id }, "losses", 1);
  }
}
