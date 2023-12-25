const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Type = sequelize.define('type', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  Type.associate = function(models) {
    Type.belongsToMany(models.Pokemon, { through: 'PokemonType' }); // asume que 'PokemonType' es tu tabla de unión
  };
  return Type;
};