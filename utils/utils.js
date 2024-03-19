const ticker = require('../models/tickerModel')

// utils.js
module.exports = {
    formatDtoModels(type, paramBag) {
        switch (type) {
            case 'ticker':
                tickerData = {
                    'timestamp': Date.now(),
                    'createdAt': getCurrentDayTime(),
                }

                let data = { ...paramBag, ...tickerData };
                let t =  new ticker(data);
                
                if (!t.symbol) {
                    t.symbol = t.market.split('-')[0];
                    t.name = t.symbol;
                }  

                return t;
            default:
                return '';
        }
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