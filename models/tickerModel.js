class Ticker {
    constructor(params) {
        this.symbol = params.symbol;
        this.price = params.price;
        this.quantity = params.quantity;
    }
}

module.exports = Ticker;