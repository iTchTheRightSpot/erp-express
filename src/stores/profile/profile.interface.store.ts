import { IProfile } from '@models/profile/profile.model';

export interface IProfileStore {
  save(o: IProfile): Promise<IProfile>;
  delete(profileId: number): Promise<number>;
}
