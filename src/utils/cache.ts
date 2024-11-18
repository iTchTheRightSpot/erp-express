export interface ICache<K, V> {
  put(key: K, value: V): void;
  get(key: K): V | undefined;
  delete(key: K): boolean;
  clear(): void;
}

export class InMemoryCache<K, V> implements ICache<K, V> {
  private readonly cache = new Map<
    K,
    { timeout: ReturnType<typeof setTimeout>; last_access: Date; value: V }
  >();
  private readonly expiration: number;

  /**
   * Creates an instance of {@link InMemoryCache}.
   *
   * @param duration - The duration (in minutes) for which each cache item remains valid.
   *   Once this time is exceeded, the item is considered expired and will be removed from the cache.
   * @param maxSize - The maximum number of items allowed in the cache.
   *   When the cache reaches this size, the least used item will be removed.
   */
  constructor(
    duration: number,
    private readonly maxSize: number
  ) {
    this.expiration = duration * 60;
  }

  get(key: K): V | undefined {
    const val = this.cache.get(key);
    if (!val) return undefined;
    val.last_access = new Date();
    return val.value;
  }

  put(key: K, value: V): void {
    const bool = this.cache.size === this.maxSize;

    if (bool) {
      const least = this.leastUsed();
      if (least) this.delete(least);
    }

    const exist = this.cache.get(key);
    if (exist) clearTimeout(exist.timeout);
    const timeout = setTimeout(() => this.cache.delete(key), this.expiration);
    this.cache.set(key, {
      timeout: timeout,
      last_access: new Date(),
      value: value
    });
  }

  delete(key: K): boolean {
    const val = this.cache.get(key);
    if (!val) return false;
    clearTimeout(val.timeout);
    return this.cache.delete(key);
  }

  clear(): void {
    for (let key of this.cache.keys()) {
      this.delete(key);
    }
  }

  private readonly leastUsed = () => {
    let k: K | undefined = undefined;
    let time = new Date();
    for (let [key, value] of this.cache) {
      if (value.last_access < time) {
        k = key;
        time = value.last_access;
      }
    }
    return k;
  };
}
