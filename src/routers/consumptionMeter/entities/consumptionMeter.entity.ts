import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ConsumptionMeter {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  image: string;

  @Column()
  customerCode: string;

  @Column()
  measure_datetime: string;

  @Column()
  type: string;

  // @Column("decimal", { precision: 10, scale: 2 })
  // value: number;

  // @Column({ default: false })
  // confirmed: boolean;

  // @Column()
  // imageLink: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
