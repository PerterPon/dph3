
/*
 * bitfinex-pricer.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 22:06:31 GMT+0800 (CST)
 */

import * as _ from 'lodash';
import * as ccxt from 'ccxt';

import { BasePricer } from 'src/pricers/base-pricer';

// import { BitfinexConnection } from 'src/connections/bitfinex-connection';
import { BitfinexConnection } from 'src/connections/bitfinex-connection-ws';
import { BitfinexOrderBook } from 'src/pricers/bitfinex-order-book';

import { DPHCoin, StandardCoin, DPHExchange } from 'src/enums/main';

import { TOrderBook } from 'pricer-types';

export class BitfinexPricer extends BasePricer {

    public pricerName: string = 'bitfinex';
    public exchangeName: DPHExchange = DPHExchange.BITFINEX;

    private connection: BitfinexConnection = null;
    private orderBookMap: Map<string, BitfinexOrderBook> = new Map();

    public async init(): Promise<void> {
        this.connection = await BitfinexConnection.getInstance();
    }

    public async registerCoin(coin: DPHCoin, standardCoin: StandardCoin): Promise<void> {
        const coinSymbol: string = this.fetchSymbol(coin, standardCoin);
        if (undefined === coinSymbol) {
            const error: Error = new Error(`trying to register coin: [${coin}], standard coin: [${standardCoin}], but could not found symbol`);
            throw error;
        }

        const bfxOrderBook: BitfinexOrderBook = new BitfinexOrderBook();
        this.orderBookMap.set(coinSymbol, bfxOrderBook);
        this.connection.subscribeOrderBook(coinSymbol);
        this.connection.onOrderBook({
            symbol: coinSymbol
        }, (data: [number, number, number]|[number, number, number][]) => {
            const [orderId, price, amount] = data as [number, number, number];
            let orderBook: TOrderBook;
            if (true === _.isArray(orderId)) {
                orderBook = bfxOrderBook.updateSnapshort(data as [number, number, number][]);
            } else {
                orderBook = bfxOrderBook.update(orderId, price, amount);
            }
            this.pushOrderBook(coin, standardCoin, orderBook);
        });
        // this.connection.onOrderBook({
        //     symbol: coinSymbol
        // }, (ob: TOrderBook) => {
        //     const asks: [number, number][] = [];
        //     const bids: [number, number][] = [];
        //     for (let i = 0; i < ob.asks.length; i++) {
        //         const ask = ob.asks[i];
        //         // bitfinex's order book format: [price, orderCount, amount]
        //         const [price, count, amount] = ask as any;
        //         asks.push([price, Math.abs(amount)]);
        //     }

        //     for (let i = 0; i < ob.bids.length; i++) {
        //         const bid = ob.bids[i];
        //         // bitfinex's order book format: [price, orderCount, amount]
        //         const [price, count, amount] = bid as any;
        //         bids.push([price, Math.abs(amount)]);
        //     }
        //     let bitfinexOB: TOrderBook = {
        //         asks,
        //         bids
        //     };
        //     this.pushOrderBook(coin, standardCoin, bitfinexOB);
        // });
    }

}
