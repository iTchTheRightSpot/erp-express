import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator';

export enum ReservationEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface ReservationEntity {
  reservation_id: number;
  staff_id: number;
  name: string;
  email: string;
  description: string | null;
  address: string;
  phone: string | null;
  image_key: string | null;
  amount_quote: string;
  status: ReservationEnum;
  created_at: Date;
  scheduled_for: Date;
  expire_at: Date;
}

export interface ServiceReservationEntity {
  junction_id: number;
  reservation_id: number;
  service_id: number;
}

export class ReservationPayload {
  @IsDefined({ message: 'staff_id has to be defined' })
  @IsNotEmpty({ message: 'staff_id cannot be empty' })
  @IsString({ message: 'staff_id has to be a string' })
  @MinLength(36, { message: 'staff_id must be at min 36 characters' })
  @MaxLength(37, { message: 'staff_id must be at most 37 characters' })
  staff_id: string;

  @IsDefined({ message: 'email has to be defined' })
  @IsNotEmpty({ message: 'email cannot be empty' })
  @IsString({ message: 'email has to be a string' })
  @MaxLength(320, { message: 'email must be at most 320 characters' })
  email: string;

  @IsOptional()
  @MaxLength(255, { message: 'description must be at most 255 characters' })
  description: string;

  @IsOptional()
  @MaxLength(255, { message: 'address must be at most 255 characters' })
  address: string;

  @IsOptional()
  @MaxLength(20, { message: 'phone must be at most 20 characters' })
  phone: string;

  @IsDefined({ message: 'please select 1 or more services' })
  @IsNotEmpty({ message: 'please select 1 or more services' })
  services: string[];

  @IsDefined({ message: 'your timezone is missing' })
  @IsNotEmpty({ message: 'your timezone is missing' })
  @IsString({ message: 'timezone has to be a string' })
  timezone: string;

  @IsDefined({ message: 'please select an appointment date & time' })
  time: number;
}
