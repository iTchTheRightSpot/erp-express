import { IStaffService } from './staff.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { NotFoundException } from '@exceptions/not-found.exception';
import { InsertionException } from '@exceptions/insertion.exception';
import { StaffServiceEntity } from '@models/staff/staff.model';

export class StaffService implements IStaffService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapter: Adapters
  ) {}

  async linkServiceToStaff(
    staffUUID: string,
    serviceName: string
  ): Promise<void> {
    const staff = await this.adapter.staffStore.staffByUUID(staffUUID.trim());
    if (!staff)
      throw new NotFoundException(`no staff found with id ${staffUUID}`);

    const service = await this.adapter.serviceStore.serviceByName(
      serviceName.trim()
    );
    if (!service)
      throw new NotFoundException(`no service found with name ${serviceName}`);

    // validate not duplicate
    const count =
      await this.adapter.staffServiceStore.countByStaffIdAndServiceId(
        staff.staff_id,
        service.service_id
      );
    if (count > 0)
      throw new InsertionException(
        `staff with id ${staffUUID} already offers ${serviceName}`
      );

    await this.adapter.staffServiceStore.save({
      staff_id: staff.staff_id,
      service_id: service.service_id
    } as StaffServiceEntity);
  }
}
