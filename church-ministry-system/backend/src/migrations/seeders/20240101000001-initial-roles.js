'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM roles WHERE name IN ('priest','sector_leader','service_leader','assistant_service_leader','class_leader','servant','served_member','parent')`,
      { type: Sequelize.QueryTypes.SELECT },
    );
    const existingNames = existing.map(r => r.name);
    const allRoles = [
      { name: 'priest', label: 'Priest' },
      { name: 'sector_leader', label: 'Sector Leader' },
      { name: 'service_leader', label: 'Service Leader' },
      { name: 'assistant_service_leader', label: 'Assistant Service Leader' },
      { name: 'class_leader', label: 'Class Leader' },
      { name: 'servant', label: 'Servant' },
      { name: 'served_member', label: 'Served Member' },
      { name: 'parent', label: 'Parent' },
    ];
    const toInsert = allRoles.filter(r => !existingNames.includes(r.name));
    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('roles', toInsert);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
