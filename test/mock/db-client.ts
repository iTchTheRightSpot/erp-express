import { IDatabaseClient } from '@stores/db-client';
import { PoolClient, QueryResult } from 'pg';

export class MockLiveDatabaseClient implements IDatabaseClient {
  constructor(private readonly client: PoolClient) {}

  exec(query: string, ...args: any[]): Promise<QueryResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const q = await this.client.query(query, [...args]);
        resolve(q);
      } catch (e) {
        reject(e);
      }
    });
  }
}
