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
  pgm.createType('reservationenum', ['PENDING', 'CONFIRMED', 'CANCELLED']);

  pgm.createTable(
    'reservation',
    {
      reservation_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      name: { type: 'VARCHAR(100)', notNull: false, unique: false },
      email: { type: 'VARCHAR(320)', notNull: false, unique: false },
      description: { type: 'VARCHAR(255)', notNull: false, unique: false },
      address: { type: 'VARCHAR(255)', notNull: false, unique: false },
      phone: { type: 'VARCHAR(20)', notNull: false, unique: false },
      image_key: { type: 'VARCHAR(37)', notNull: false, unique: false },
      amount_quote: { type: 'DECIMAL(6, 2)', notNull: true, unique: false },
      status: { type: 'reservationenum', notNull: true, default: 'PENDING' },
      created_at: { type: 'TIMESTAMP', notNull: true, unique: false },
      scheduled_for: { type: 'TIMESTAMP', notNull: true, unique: false },
      expire_at: { type: 'TIMESTAMP', notNull: true, unique: false },
      staff_id: { type: 'BIGINT', notNull: true }
    },
    {
      ifNotExists: true
    }
  );

  pgm.addConstraint('reservation', 'FK_reservation_to_staff_staff_id', {
    foreignKeys: {
      columns: 'staff_id',
      references: 'staff(staff_id)',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  });

  pgm.createIndex('reservation', ['email'], {
    name: 'IX_reservation_email'
  });
  pgm.createIndex(
    'reservation',
    ['staff_id', 'scheduled_for', 'expire_at', 'status'],
    { name: 'IX_reservation_composite1' }
  );
  pgm.createIndex('reservation', ['email', 'scheduled_for', 'expire_at'], {
    name: 'IX_reservation_composite2'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('reservation', 'FK_reservation_to_staff_staff_id', {
    ifExists: true
  });
  pgm.dropIndex('reservation', null, {
    name: 'IX_reservation_email',
    ifExists: true
  });
  pgm.dropIndex('reservation', null, {
    name: 'IX_reservation_composite1',
    ifExists: true
  });
  pgm.dropIndex('reservation', null, {
    name: 'IX_reservation_composite2',
    ifExists: true
  });
  pgm.dropTable('reservation', { ifExists: true });
  pgm.dropType('reservationenum', { ifExists: true });
};
