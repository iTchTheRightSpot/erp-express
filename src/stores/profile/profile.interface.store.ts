import { ProfileEntity } from '@models/profile/profile.model';

export interface IProfileStore {
  save(o: ProfileEntity): Promise<ProfileEntity>;
  delete(profileId: number): Promise<number>;
}
