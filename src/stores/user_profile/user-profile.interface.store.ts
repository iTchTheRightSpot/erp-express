import { UserProfile } from '@models/user_profile/user-profile.model';

export interface IProfileStore {
  save(o: UserProfile): Promise<UserProfile>;
  delete(profileId: number): Promise<number>;
}
