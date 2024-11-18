import { ILogger } from '@utils/log';
import { Router } from 'express';
import { IShiftService } from '@services/shift/shift.interface.service';

export class ShiftHandler {
  constructor(
    private readonly router: Router,
    private readonly logger: ILogger,
    private readonly service: IShiftService
  ) {}
}
