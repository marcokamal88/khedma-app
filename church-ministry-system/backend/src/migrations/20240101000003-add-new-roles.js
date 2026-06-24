'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE roles
      MODIFY COLUMN name ENUM('servant','served_member','parent','sector_leader','priest','service_leader','assistant_service_leader','class_leader')
      NOT NULL
    `);

    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM roles WHERE name IN ('service_leader','assistant_service_leader','class_leader')`,
      { type: Sequelize.QueryTypes.SELECT },
    );
    const existingNames = existing.map(r => r.name);

    const newRoles = [];
    if (!existingNames.includes('service_leader')) {
      newRoles.push({ name: 'service_leader', label: 'Service Leader' });
    }
    if (!existingNames.includes('assistant_service_leader')) {
      newRoles.push({ name: 'assistant_service_leader', label: 'Assistant Service Leader' });
    }
    if (!existingNames.includes('class_leader')) {
      newRoles.push({ name: 'class_leader', label: 'Class Leader' });
    }

    if (newRoles.length > 0) {
      await queryInterface.bulkInsert('roles', newRoles);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', {
      name: { [Sequelize.Op.in]: ['service_leader', 'assistant_service_leader', 'class_leader'] },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE roles
      MODIFY COLUMN name ENUM('servant','served_member','parent','sector_leader','priest')
      NOT NULL
    `);
  },
};
