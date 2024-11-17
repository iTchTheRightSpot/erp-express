import { IProfileStore } from '@stores/profile/profile.interface.store';
import { ILogger } from '@utils/log';
import { Profile } from '@models/profile/profile.model';
import { IDatabaseClient } from '@stores/db-client';

export class ProfileStore implements IProfileStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(o: Profile): Promise<Profile> {
    return new Promise<Profile>(async (resolve, reject) => {
      const query = `
        INSERT INTO user_profile (firstname, lastname, email, image_key)
        VALUES ($1, $2, $3, $4)
        RETURNING profile_id, firstname, lastname, email, image_key
    `;

      try {
        const res = await this.db.execContext(
          query.trim(),
          o.firstname,
          o.lastname,
          o.email,
          o.image_key || null
        );

        const row = res.rows[0] as Profile;
        row.profile_id = Number(row.profile_id);
        resolve(row);
        this.logger.log('new insert to user_profile');
      } catch (e) {
        this.logger.error(
          `failed to insert into user_profile: ${JSON.stringify(e)}`
        );
        reject(e);
      }
    });
  }

  delete(profileId: number): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.execContext(
          'DELETE FROM user_profile WHERE profile_id = $1',
          profileId
        );

        const count = res.rowCount;
        if (!count || count === 0) {
          this.logger.log(`no user_profile with id ${profileId} to delete`);
          return resolve(0);
        }

        resolve(count);
        this.logger.log(
          `deleted profile_id ${profileId} from user_profile table`
        );
      } catch (e) {
        this.logger.error(`failed to delete from user_profile ${e}`);
        reject(e);
      }
    });
  }
}
