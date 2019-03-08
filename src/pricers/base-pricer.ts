
/*
 * base-pricer.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 15:57:19 GMT+0800 (CST)
 */

import * as _ from 'lodash';
import * as ccxt from 'ccxt';

import { BitfinexConnection } from 'src/connections/bitfinex-connection';

import { DPHCoin, StandardCoin, DPHExchange } from 'src/enums/main';

import { getLogger } from 'src/core/log';

import { DPHName } from 'main-types';
import { TOrderBook } from 'pricer-types';
import { Log4js, Logger } from 'log4js';
import { fetchSymbol } from 'src/util';

export interface IPricer {
    init(): Promise<void>;
    registerCoin(coin: DPHCoin, standardCoin: StandardCoin): Promise<void>;
    getOrderBook(coin: DPHCoin, standardCoin: StandardCoin): Promise<TOrderBook>;
}

export abstract class BasePricer implements IPricer {

    public pricerName: string = null;
    public exchangeName: DPHExchange = null;

    protected OBQueue: Map<string, Function[]> = new Map();
    protected OBMap: Map<string, TOrderBook> = new Map();

    public async init(): Promise<void> {

    }

    public async registerCoin(coin: DPHCoin, standardCoin: StandardCoin): Promise<void> {
    }

    public async getOrderBook(coin: DPHCoin, standardCoin: StandardCoin): Promise<TOrderBook> {
        const symbol: string = `${coin}_${standardCoin}`;
        let fnQueue: Function[] | undefined = this.OBQueue.get(symbol);
        if (undefined === fnQueue) {
            fnQueue = [];
        }

        return new Promise<TOrderBook>((resolve, reject) => {
            fnQueue.push(resolve);
            this.OBQueue.set(symbol, fnQueue);
        });
    }

    protected pushOrderBook(coin: DPHCoin, standardCoin: StandardCoin, orderBook: TOrderBook): void {
        const symbol: string = `${coin}_${standardCoin}`;
        this.OBMap.set(symbol, orderBook);
        this.popOrderBook(coin, standardCoin);
    }

    protected popOrderBook(coin: DPHCoin, standardCoin: StandardCoin): void {
        const symbol: string = `${coin}_${standardCoin}`;
        let fnQueue: Function[]|undefined = this.OBQueue.get(symbol);
        if (undefined === fnQueue) {
            fnQueue = [];
        }
        const ob: TOrderBook|undefined = this.OBMap.get(symbol);
        const logger: Logger = getLogger();
        if (undefined === ob) {
            logger.error(`pricer [${this.pricerName}] trying to pop order book but could not found ob! coin: [${coin}], standard coin: [${standardCoin}]`);
            return;
        }

        for (let i = 0; i < fnQueue.length; i++) {
            const fn: Function = fnQueue[i];
            if (true === _.isFunction(fn)) {
                fn(ob);
            } else {
                logger.error(`pricer [${this.pricerName}] trying to pop order book, but target queue fn was not a function! coin: [${coin}], standard coin: [${standardCoin}]`);
            }
        }
    }

    protected fetchSymbol(coin: DPHCoin, standardCoin: StandardCoin): string {
        const symbol: string = fetchSymbol(this.exchangeName, coin, standardCoin);
        return symbol;
    }

}
