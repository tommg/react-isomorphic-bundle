module.exports = function (sequelize, Sequelize) {
  return sequelize.define('usersInfo', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT.UNSIGNED
    },
    uid: {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED
    },
    ocname: {
      allowNull: true,
      type: Sequelize.STRING
    },
    contact: {
      allowNull: true,
      type: Sequelize.STRING
    },
    country: {
      allowNull: true,
      type: Sequelize.STRING
    },
    city: {
      allowNull: true,
      type: Sequelize.STRING
    },
    address: {
      allowNull: true,
      type: Sequelize.STRING
    },
    place: {
      allowNull: true,
      type: Sequelize.STRING
    },
    zipcode: {
      allowNull: true,
      type: Sequelize.INTEGER
    },
    lat: {
      validate: { min: -90, max: 90 },
      allowNull: true,
      defaultValue: null,
      type: Sequelize.DOUBLE.UNSIGNED
    },
    lng: {
      validate: { min: -180, max: 180 },
      allowNull: true,
      defaultValue: null,
      type: Sequelize.DOUBLE.UNSIGNED
    },
    tel: {
      allowNull: true,
      type: Sequelize.STRING
    },
    fax: {
      allowNull: true,
      type: Sequelize.STRING
    },
    url: {
      allowNull: true,
      type: Sequelize.STRING
    },
    email: {
      allowNull: true,
      validate: {
        isEmail: true
      },
      type: Sequelize.STRING
    }
  }, {
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      }
    },
    validate: {
      bothCoordsOrNone: function () {
        if ((this.lat === null) !== (this.lng === null)) {
          throw new Error(
            'Require either both latitude and longitude or neither'
          )
        }
      }
    },
    instanceMethods: {
      toJSON: function () {
        const values = this.get()
        delete values.id
        delete values.created_at
        delete values.updated_at
        delete values.deleted_at
        return values
      }
    }
  })
}
