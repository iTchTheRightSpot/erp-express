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
  pgm.createType('permissionenum', ['READ', 'WRITE', 'DELETE']);

  pgm.createTable(
    'permission',
    {
      permission_id: {
        primaryKey: true,
        type: 'BIGSERIAL',
        notNull: true,
        unique: true
      },
      permission: {
        type: 'permissionenum',
        notNull: true
      },
      role_id: { type: 'BIGINT', notNull: true }
    },
    { ifNotExists: true }
  );

  pgm.addConstraint('permission', 'FK_permission_to_role_role_id', {
    foreignKeys: {
      columns: 'role_id',
      references: 'role(role_id)',
      onDelete: 'CASCADE',
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
  pgm.dropConstraint('permission', 'FK_permission_to_role_role_id', {
    ifExists: true
  });
  pgm.dropTable('permission', { ifExists: true });
  pgm.dropType('permissionenum', { ifExists: true });
};
