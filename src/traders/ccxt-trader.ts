
/*
 * ccxt-trader.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sun Feb 24 2019 22:44:37 GMT+0800 (CST)
 */

import * as ccxt from 'ccxt';

import { BaseTrader } from 'src/traders/base-trader';
import { TDPHConfig, TExchangeConfig } from 'main-types';
import { getConfig } from 'src/core/config';
import { trackOrder } from 'src/core/order-tracker';
import { DPHExchange, ETradeType, StandardCoin, DPHCoin, ECCXTOrderStatus } from 'src/enums/main';
import { TTHAction } from 'action-types';
import { fetchSymbol } from 'src/util';
import { TCCXTOrderStatus } from 'trade-types';
import { Logger } from 'log4js';
import { getLogger } from 'src/core/log';
import chalk from 'chalk';

interface CCXTExchange {
    new(opts: any): ccxt.Exchange;
}

const ccxtExchangeMap: Map<DPHExchange, CCXTExchange> = new Map([
    [DPHExchange.BITFINEX, ccxt.bitfinex],
    [DPHExchange.BINANCE, ccxt.binance],
    [DPHExchange.HUOBIPRO, ccxt.huobipro]
]);

let trader: CCXTTrader = null;

const ccxtSymbolMap: Map<DPHExchange, Map<StandardCoin, Map<DPHCoin, string>>> = new Map([
    [DPHExchange.BITFINEX, new Map([
        [StandardCoin.USD, new Map([
            [DPHCoin.BTC, 'BTC/USD'],
            [DPHCoin.ETH, 'BTC/USD']
        ])]
    ])],
    [DPHExchange.BINANCE, new Map([
        [StandardCoin.USD, new Map([
            [DPHCoin.BTC, 'BTC/USDT'],
            [DPHCoin.ETH, 'ETH/USDT']
        ])]
    ])]
]);

export class CCXTTrader extends BaseTrader {

    public static instance: CCXTTrader = null;

    public static async getInstrance(): Promise<CCXTTrader> {
        if (null === trader) {
            trader = new CCXTTrader();
        }
        return trader;
    }

    private exchangeMap: Map<DPHExchange, ccxt.Exchange> = new Map();

    public async init(): Promise<void> {
        const config: TDPHConfig = getConfig();
        const exchanges: any = config.exchanges;
        for (let exchangeName in exchanges) {
            const dphExchange: DPHExchange = exchangeName as DPHExchange;
            const ccxtExchange: CCXTExchange = ccxtExchangeMap.get(dphExchange);
            if (undefined === ccxtExchange) {
                throw new Error(`[CCXT TRADER] trying to get exchange: [${exchangeName}], but could not found in ccxt!`);
            }
            const exchangeConfig: TExchangeConfig = exchanges[exchangeName];
            const exchange: ccxt.Exchange = new ccxtExchange({
                apiKey: exchangeConfig.apiKey,
                secret: exchangeConfig.apiSecret
            });
            this.exchangeMap.set(dphExchange, exchange);
        }
    }

    public async excute(action: TTHAction) {
        const exchange: DPHExchange = action.exchange;
        const ccxtExchange: ccxt.Exchange | undefined = this.exchangeMap.get(exchange);
        if (undefined === ccxtExchange) {
            const error: Error = new Error(`[CCXT TRADER] trying to excute action, but could not found ccxt exchange: [${exchange}]`);
            throw error;
        }
        const symbol: string = this.fetchCCXTSymbol(action.exchange, action.standardCoin, action.coin);
        const logger: Logger = getLogger();
        try {
            const amount: number = 0.004;
            console.log(`creat order: ${exchange}, ${symbol}, ${action.price}, ${action.amount}`);
            const result: TCCXTOrderStatus = await ccxtExchange.createOrder(symbol, action.orderType, action.action, 0.004, action.price);
            trackOrder(exchange, ccxtExchange, result.id, symbol);
        } catch(e) {
            console.log(chalk.bgRed(`create order error: [${e.message}]`));
            console.log(action);
        }
    }

    private fetchCCXTSymbol(exchange: DPHExchange, standardCoin: StandardCoin, coin: DPHCoin): string {
        let symbol: string = '';
        try {
            symbol = ccxtSymbolMap.get(exchange).get(standardCoin).get(coin);
        } catch(e) {
            const error: Error = new Error(`[CCXT TREADER]trying to fetch ccxt coin symbol but faild! exchange: [${exchange}], standardCoin: [${standardCoin}], coin: [${coin}]`);
            throw error;
        }
        return symbol;
    }

}
