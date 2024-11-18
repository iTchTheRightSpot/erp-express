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
    'shift',
    {
      shift_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      shift_start: { type: 'timestamp', notNull: true },
      shift_end: { type: 'timestamp', notNull: true },
      is_visible: { type: 'boolean', notNull: true, default: false },
      is_reoccurring: { type: 'boolean', notNull: true, default: false },
      staff_id: { type: 'BIGINT', notNull: true }
    },
    {
      ifNotExists: true
    }
  );

  pgm.addConstraint('shift', 'FK_shift_to_staff_staff_id', {
    foreignKeys: {
      columns: 'staff_id',
      references: 'staff(staff_id)',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  });

  pgm.createIndex('shift', ['staff_id', 'shift_start', 'shift_end'], {
    name: 'IX_shift_composite1'
  });
  pgm.createIndex(
    'shift',
    ['staff_id', 'shift_start', 'shift_end', 'is_visible'],
    { name: 'IX_shift_composite2' }
  );
  pgm.createIndex('shift', ['shift_start', 'shift_end', 'is_reoccurring'], {
    name: 'IX_shift_composite3'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('shift', 'FK_shift_to_staff_staff_id', {
    ifExists: true
  });

  pgm.dropIndex('shift', null, {
    name: 'IX_shift_composite1',
    ifExists: true
  });
  pgm.dropIndex('shift', null, {
    name: 'IX_shift_composite2',
    ifExists: true
  });
  pgm.dropIndex('shift', null, {
    name: 'IX_shift_composite3',
    ifExists: true
  });

  pgm.dropTable('shift', { ifExists: true, cascade: true });
};
