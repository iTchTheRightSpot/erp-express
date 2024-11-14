import { UserProfile } from '@models/user_profile/user-profile.model';

export interface IUserProfileStore {
  save(o: UserProfile): Promise<UserProfile>;
  delete(profileId: number): Promise<number>;
}
