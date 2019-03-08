
/*
 * main.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:58:45 GMT+0800 (CST)
 */

export enum DPHExchange {
    UNKNOW = 'unknow',
    BITFINEX = 'bitfinex',
    HUOBIPRO = 'huobipro',
    BINANCE = 'binance'
}

export enum DPHCoin {
    BTC = "BTC",
    ETH = "ETH"
}

export enum StandardCoin {
    USD = 'USD',
    BTC = 'BTC'
}

export enum ETradeType {
    SELL = 'sell',
    BUY = 'buy'
}

export enum EOrderType {
    MARKET = 'market',
    LIMIT = 'limit'
}

export enum EStrategyType {
    UNKNOW = 'UNKNOW',
    TH = 'TH'
}

export enum ECCXTOrderStatus {
    UNKNOW = 'UNKNOW',
    CANCELED = 'canceled',
    OPEN = 'open',
    CLOSED = 'closed'
}
