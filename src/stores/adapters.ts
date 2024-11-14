import { ITransactionProvider } from '@stores/transaction';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import { IProfileStore } from '@stores/user_profile/user-profile.interface.store';
import { UserProfileStore } from '@stores/user_profile/user-profile.store';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { StaffStore } from '@stores/staff/staff.store';
import { RoleStore } from '@stores/role/role.store';
import { IRoleStore } from '@stores/role/role.interface.store';

/**
 * Holds all classes that directly communicate with the database.
 * Provides access to specific data stores and optional transaction management.
 */
export interface Adapters {
  profileStore: IProfileStore;
  roleStore: IRoleStore;
  staffStore: IStaffStore;
  txProvider?: ITransactionProvider;
}

/**
 * Creates an instance of the {@link Adapters}.
 *
 * @param logger - A logging instance.
 * @param client - An instance of {@link IDatabaseClient} for interacting with db.
 * @param tx - An optional instance of {@link ITransactionProvider} for handling transactions.
 */
export const initializeAdapters = (
  logger: ILogger,
  client: IDatabaseClient,
  tx?: ITransactionProvider
) => {
  const store: Adapters = {
    profileStore: new UserProfileStore(logger, client),
    roleStore: new RoleStore(logger, client),
    staffStore: new StaffStore(logger, client),
    txProvider: tx
  };
  return store;
};
