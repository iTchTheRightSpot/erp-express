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
    'profile',
    {
      profile_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      firstname: { type: 'varchar(100)', notNull: true, unique: false },
      lastname: { type: 'varchar(100)', notNull: true, unique: false },
      email: { type: 'varchar(320)', notNull: true, unique: true },
      image_key: { type: 'varchar(255)', notNull: false, unique: false }
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
  pgm.dropTable('profile', { ifExists: true });
};
