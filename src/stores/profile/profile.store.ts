import { IProfileStore } from '@stores/profile/profile.interface.store';
import { ILogger } from '@utils/log';
import { ProfileEntity } from '@models/profile/profile.model';
import { IDatabaseClient } from '@stores/db-client';

export class ProfileStore implements IProfileStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(o: ProfileEntity): Promise<ProfileEntity> {
    return new Promise<ProfileEntity>(async (resolve, reject) => {
      const query = `
        INSERT INTO profile (firstname, lastname, email, image_key)
        VALUES ($1, $2, $3, $4)
        RETURNING profile_id, firstname, lastname, email, image_key
    `;

      try {
        const res = await this.db.exec(
          query.trim(),
          o.firstname,
          o.lastname,
          o.email,
          o.image_key || null
        );

        const row = res.rows[0] as ProfileEntity;
        row.profile_id = Number(row.profile_id);
        resolve(row);
        this.logger.log('new insert to profile');
      } catch (e) {
        this.logger.error(
          `failed to insert into profile: ${JSON.stringify(e)}`
        );
        reject(e);
      }
    });
  }

  delete(profileId: number): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          'DELETE FROM profile WHERE profile_id = $1',
          profileId
        );

        const count = res.rowCount;
        if (!count || count === 0) {
          this.logger.log(`no profile with id ${profileId} to delete`);
          return resolve(0);
        }

        resolve(count);
        this.logger.log(`deleted profile_id ${profileId} from profile table`);
      } catch (e) {
        this.logger.error(`failed to delete from profile ${e}`);
        reject(e);
      }
    });
  }
}
