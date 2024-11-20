import { ITransactionProvider } from './transaction';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from './db-client';
import { IProfileStore } from './profile/profile.interface.store';
import { ProfileStore } from './profile/profile.store';
import { IStaffServiceStore, IStaffStore } from './staff/staff.interface.store';
import { StaffStore } from './staff/staff.store';
import { RoleStore } from './role/role.store';
import { IPermissionStore, IRoleStore } from './role/role.interface.store';
import { PermissionStore } from './role/permission.store';
import { IShiftStore } from './shift/shift.interface.store';
import { ShiftStore } from './shift/shift.store';
import { ServiceStore } from './service/service.store';
import { IServiceStore } from './service/service.interface.store';
import { StaffServiceStore } from './staff/staff-service.store';
import { IReservationStore } from './reservation/reservation.interface.store';
import { ReservationStore } from './reservation/reservation.store';

/**
 * Holds all classes that directly communicate with the database.
 * Provides access to specific data stores and optional transaction management.
 */
export interface Adapters {
  profileStore: IProfileStore;
  roleStore: IRoleStore;
  permissionStore: IPermissionStore;
  staffStore: IStaffStore;
  shiftStore: IShiftStore;
  serviceStore: IServiceStore;
  staffServiceStore: IStaffServiceStore;
  reservationStore: IReservationStore;
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
    profileStore: new ProfileStore(logger, client),
    roleStore: new RoleStore(logger, client),
    permissionStore: new PermissionStore(logger, client),
    staffStore: new StaffStore(logger, client),
    shiftStore: new ShiftStore(logger, client),
    serviceStore: new ServiceStore(logger, client),
    staffServiceStore: new StaffServiceStore(logger, client),
    reservationStore: new ReservationStore(logger, client),
    txProvider: tx
  };
  return store;
};
