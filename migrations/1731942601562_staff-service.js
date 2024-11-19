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
    'staff_service',
    {
      junction_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      staff_id: { type: 'BIGINT', notNull: true },
      service_id: { type: 'BIGINT', notNull: true }
    },
    {
      ifNotExists: true
    }
  );

  pgm.addConstraint('staff_service', 'FK_staff_service_to_service_service_id', {
    foreignKeys: {
      columns: 'service_id',
      references: 'service(service_id)',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  });

  pgm.addConstraint('staff_service', 'FK_staff_service_to_staff_staff_id', {
    foreignKeys: {
      columns: 'staff_id',
      references: 'staff(staff_id)',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint(
    'staff_service',
    'FK_staff_service_to_service_service_id',
    {
      ifExists: true
    }
  );
  pgm.dropConstraint('staff_service', 'FK_staff_service_to_staff_staff_id', {
    ifExists: true
  });
  pgm.dropTable('staff_service', { ifExists: true });
};
