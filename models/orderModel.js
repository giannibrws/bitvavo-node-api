const utils = require('../utils/utils');


class Order {
    constructor(params) {
        this.id = params.orderId;
        this.market = params.market;
        this.amount = params.amount;
        this.amountBought = params.filledAmount + '/' + params.amount;
        this.pricePerToken = params.price;
        this.totalPrice = params.onHold;
        this.boughtAt = utils.getCurrentDayTime(params.created);
    }

    format(params) {
        return {
        };
    }
}

module.exports = Order;