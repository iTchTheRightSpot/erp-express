import { ILogger } from '@utils/log';

export interface IMailService {
  sendAppointmentCreation(): Promise<void>;
}

export class MailService implements IMailService {
  constructor(private readonly logger: ILogger) {}

  async sendAppointmentCreation(): Promise<void> {}
}
