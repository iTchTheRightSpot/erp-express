import { ITransactionProvider } from '@stores/transaction';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

/**
 * Holds all classes that directly communicate with the database.
 * Provides access to specific data stores and optional transaction management.
 */
export interface Adapters {
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
) =>
  ({
    txProvider: tx
  }) as Adapters;
