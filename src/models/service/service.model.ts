import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import Decimal from 'decimal.js';

export interface ServiceEntity {
  service_id: string;
  name: string;
  price: Decimal;
  is_visible: boolean;
  duration: number;
  clean_up_time: number;
}

export class ServicePayload {
  @IsDefined({ message: 'name has to be defined' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  @IsString({ message: 'name has to be a string' })
  @MaxLength(50, { message: 'name must be at most 50 characters' })
  name: string;

  @IsDefined({ message: 'price has to be defined' })
  @IsNotEmpty({ message: 'price cannot be empty' })
  @IsString({ message: 'price has to be a string' })
  price: string;

  @IsDefined({ message: 'is_visible has to be defined' })
  is_visible: boolean;

  @IsDefined({ message: 'duration has to be defined' })
  duration: number;

  @IsDefined({ message: 'clean_up_time has to be defined' })
  clean_up_time: number;
}
