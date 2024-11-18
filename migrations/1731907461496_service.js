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
    'service',
    {
      service_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      name: { type: 'varchar(50)', notNull: true, unique: true },
      price: { type: 'decimal(50)', notNull: true },
      is_visible: { type: 'bool', notNull: true, default: false },
      duration: { type: 'integer', notNull: true },
      clean_up_time: { type: 'integer', notNull: true }
    },
    {
      ifNotExists: true
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('service', { ifExists: true });
};
