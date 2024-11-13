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
    'staff',
    {
      staff_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      staff_uuid: { type: 'varchar(37)', notNull: true, unique: true },
      bio: { type: 'varchar(255)', notNull: false, unique: false },
      profile_id: { type: 'BIGINT', notNull: false }
    },
    {
      ifNotExists: true
    }
  );

  pgm.addConstraint('staff', 'FK_staff_to_user_profile_profile_id', {
    foreignKeys: {
      columns: 'profile_id',
      references: 'user_profile(profile_id)',
      onDelete: 'SET NULL',
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
  pgm.dropConstraint('staff', 'FK_staff_to_user_profile_profile_id', {
    ifExists: true,
    cascade: true
  });
  pgm.dropTable('staff', { ifExists: true, cascade: true });
};
