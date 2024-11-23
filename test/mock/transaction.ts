import { ITransactionProvider } from '@stores/transaction';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { PoolClient } from 'pg';
import { ILogger } from '@utils/log';
import { MockLiveDatabaseClient } from './db-client';

export class MockLiveTransactionProvider implements ITransactionProvider {
  constructor(
    private readonly logger: ILogger,
    private readonly client: PoolClient
  ) {}

  async runInTransaction<T>(
    txFunc: (adapters: Adapters) => Promise<T>
  ): Promise<T> {
    try {
      return await txFunc(
        initializeAdapters(this.logger, new MockLiveDatabaseClient(this.client))
      );
    } catch (error) {
      this.logger.log('test transaction error: ', error);
      throw error;
    }
  }
}
