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
    const adap = initializeAdapters(
      this.logger,
      new MockLiveDatabaseClient(this.client)
    );

    try {
      return await txFunc(adap);
    } catch (error) {
      this.logger.log('test transaction error: ', error);
      throw error;
    }
  }
}
