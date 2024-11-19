import { Pool, PoolClient, QueryResult } from 'pg';

export interface IDatabaseClient {
  /**
   * Executes a SQL query against the database for reading or writing data.
   *
   * This method is responsible for executing queries that interact with the database,
   * modifying its state if necessary. It provides flexibility to handle both read
   * and write operations.
   *
   * @param query - The SQL query to execute. Can be a read or write operation.
   * @param args - Optional parameters for the SQL query, allowing for safe parameterized queries.
   * @returns A promise that resolves to a {@link QueryResult} object, containing the result
   *          of the executed query, or rejects with an error if execution fails.
   */
  exec(query: string, ...args: any[]): Promise<QueryResult>;
}

/**
 * This class provides an implementation of the {@link IDatabaseClient} interface for non-transactional
 * operations. It is intended for use cases where each database operation is standalone and does not
 * require a transaction context. The {@link DatabaseClient} class manages the lifecycle of the connection,
 * releasing it after each operation to prevent connection leaks.
 *
 * When using this class, each call to {@link exec} will release the database connection after the
 * operation completes, regardless of success or failure. This ensures that connections are not
 * held unnecessarily and can be returned to the connection pool for reuse.
 */
export class DatabaseClient implements IDatabaseClient {
  constructor(private readonly pool: Pool) {}

  exec(query: string, ...args: any[]): Promise<QueryResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const q = await this.pool.query(query, [...args]);
        resolve(q);
      } catch (e) {
        reject(e);
      }
    });
  }
}

/**
 * This class implements the {@link IDatabaseClient} interface for use in transactional contexts. It is
 * designed to work within an active transaction, which means that connection management is handled
 * externally. Connections are not released automatically after each operation, allowing multiple
 * queries to be executed as part of a single transaction.
 *
 * When using this class, the release of the database connection is handled in {@link TransactionProvider}.
 */
export class DatabaseTransactionClient implements IDatabaseClient {
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
