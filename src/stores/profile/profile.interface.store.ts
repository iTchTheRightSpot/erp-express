import { Profile } from '@models/profile/profile.model';

export interface IProfileStore {
  save(o: Profile): Promise<Profile>;
  delete(profileId: number): Promise<number>;
}
