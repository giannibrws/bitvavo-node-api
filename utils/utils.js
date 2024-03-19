const ticker = require('../models/tickerModel')

// utils.js
module.exports = {
    formatDtoModels(type, paramBag) {
        switch (type) {
            case 'ticker':
                b2 = {
                    'timestamp': Date.now(),
                    'createdAt': getCurrentDayTime(),
                }

                let data = { ...paramBag, ...b2 };
                return new ticker(data);
            default:
                return '';
        }
    },

    subtract(a, b) {
        return a - b;
    }
};

function getCurrentDayTime() {
    // Get the current date and time
    const currentDate = new Date();

    // Format the date and time
    return currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

async function getTickerName() {
}