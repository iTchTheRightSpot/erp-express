import { Pool } from 'pg';
import { DatabaseClient, DatabaseTransactionClient } from '@stores/db-client';
import { TransactionProvider } from '@stores/transaction';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { IProfile } from '@models/profile/profile.model';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';

describe('transaction provider', () => {
  let pool: Pool;
  let adapters: Adapters;

  beforeAll(async () => {
    pool = poolInstance();
    const log = new DevelopmentLogger();
    const db = new DatabaseClient(pool);
    const tx = new TransactionProvider(log, pool);
    adapters = initializeAdapters(log, db, tx);
  });

  afterAll(async () => await pool.end());

  describe('transaction commit logic', () => {
    it('base should commit', async () =>
      await adapters.txProvider?.runInTransaction(async (adaps) => {
        const frog = await adaps.profileStore.save({
          firstname: 'frog',
          lastname: 'frog lastname',
          email: 'frog@email.com'
        } as IProfile);

        expect(frog.profile_id).toBeGreaterThan(0);
        expect(await adaps.profileStore.delete(frog.profile_id)).toEqual(1);
      }));

    it(`should commit when ${DatabaseClient.name} is called outside of ${DatabaseTransactionClient.name}`, async () => {
      let profileId: number | undefined = undefined;
      await adapters.txProvider?.runInTransaction(async (adaps) => {
        const frog = await adaps.profileStore.save({
          firstname: 'frog',
          lastname: 'frog lastname',
          email: 'frog@email.com'
        } as IProfile);

        expect(frog.profile_id).toBeGreaterThan(0);
        profileId = frog.profile_id;
      });

      expect(profileId).toBeDefined();
      expect(await adapters.profileStore.delete(profileId!!)).toEqual(1);
    });

    it(`commit when ${DatabaseClient.name} is called within ${DatabaseTransactionClient.name}`, async () =>
      await adapters.txProvider?.runInTransaction(async (adaps) => {
        const dog = await adaps.profileStore.save({
          firstname: 'dog',
          lastname: 'dog lastname',
          email: 'dog@email.com'
        } as IProfile);

        expect(dog.profile_id).toBeGreaterThan(0);

        // connection not from pool client
        // should also be 0 because the transaction has not been committed
        expect(await adapters.profileStore.delete(dog.profile_id)).toEqual(0);

        // using the same transaction connection should successfully delete
        expect(await adaps.profileStore.delete(dog.profile_id)).toEqual(1);
      }));
  });

  describe('transaction rollback logic', () => {
    it('base should rollback', async () =>
      await adapters.txProvider?.runInTransaction(async (adaps) => {
        await adaps.profileStore.save({
          firstname: 'frog',
          lastname: 'frog lastname',
          email: 'frog@email.com'
        } as IProfile);
        await expect(
          adaps.profileStore.save({
            firstname: 'frog',
            lastname: 'frog lastname',
            email: 'frog@email.com'
          } as IProfile)
        ).rejects.toThrow(
          'duplicate key value violates unique constraint "user_profile_email_key"'
        );
      }));
  });
});
