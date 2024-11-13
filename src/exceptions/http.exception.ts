export abstract class HttpException extends Error {
  protected constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
  }
}
