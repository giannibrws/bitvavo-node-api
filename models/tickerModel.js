class Ticker {
    constructor(params) {
        this.name = params.name;
        this.symbol = params.symbol;
        this.price = params.price;
        this.quantity = params.quantity;
        this.market = params.market;
        this.createdAt = params.createdAt;
        this.timestamp = params.timestamp;
    }
}

module.exports = Ticker;