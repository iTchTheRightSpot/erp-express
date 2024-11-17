import { v4 as uuid } from 'uuid';

export interface Staff {
  staff_id: number;
  uuid: uuid;
  bio: string | null;
  profile_id: number | null;
}
