import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 0 })
  wins!: number;

  @Column({ default: 0 })
  losses!: number;
}
