import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ConsumptionMeter {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "longtext" })
  image: string;

  @Column()
  customer_code: string;

  @Column()
  measure_datetime: string;

  @Column()
  measure_type: string;

  @Column("int", { nullable: true })
  value: number | null;

  @Column({ default: false })
  has_confirmed: boolean;

  @Column()
  image_url: string;

  @Column()
  measure_uuid: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
