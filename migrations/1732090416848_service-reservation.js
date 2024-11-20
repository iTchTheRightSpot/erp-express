/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable(
    'service_reservation',
    {
      junction_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      reservation_id: { type: 'BIGINT', notNull: true },
      service_id: { type: 'BIGINT', notNull: true }
    },
    {
      ifNotExists: true
    }
  );

  pgm.addConstraint(
    'service_reservation',
    'FK_service_reservation_to_appointment_appointment_id',
    {
      foreignKeys: {
        columns: 'reservation_id',
        references: 'reservation(reservation_id)',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      }
    }
  );

  pgm.addConstraint(
    'service_reservation',
    'FK_service_reservation_to_service_service_id',
    {
      foreignKeys: {
        columns: 'service_id',
        references: 'service(service_id)',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      }
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint(
    'service_reservation',
    'FK_service_reservation_to_service_service_id',
    {
      ifExists: true
    }
  );
  pgm.dropConstraint(
    'service_reservation',
    'FK_service_reservation_to_appointment_appointment_id',
    {
      ifExists: true
    }
  );
  pgm.dropTable('service_reservation', { ifExists: true });
};
