const { DataTypes, Model } = require('sequelize');

module.exports = class AutoScreenshot extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false },
            ChannelID: { type: DataTypes.STRING, allowNull: false }
        }, {
            tableName: 'AutoScreenshot',
            timestamps: true,
            sequelize
        });
    }
}
