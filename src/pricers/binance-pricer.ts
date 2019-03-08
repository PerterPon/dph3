
/*
 * binance-pricer.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sun Feb 17 2019 18:42:10 GMT+0800 (CST)
 */

import { BasePricer } from 'src/pricers/base-pricer';

import { BinanceConnection } from 'src/connections/binance-connection';

import { BinanceOrderBook } from 'src/pricers/binance-order-book';

import { DPHCoin, StandardCoin, DPHExchange } from 'src/enums/main';
import { TBinanceDepthUpdate, TOrderBook } from 'pricer-types';

export class BinancePricer extends BasePricer {

    public pricerName: string = 'binance';
    public exchangeName: DPHExchange = DPHExchange.BINANCE;
    
    private obMap: Map<string, BinanceOrderBook> = new Map();
    private connection: BinanceConnection = null;

    public async init(): Promise<void> {
        const connection: BinanceConnection = await BinanceConnection.getInstance();
        this.connection = connection;
    }

    public async registerCoin(coin: DPHCoin, standardCoin: StandardCoin): Promise<void> {
        const orderBook: BinanceOrderBook = new BinanceOrderBook();
        const symbol: string = this.fetchSymbol(coin, standardCoin);
        await orderBook.init(symbol);

        this.obMap.set(symbol, orderBook);
        this.connection.ws.websockets.depth(symbol, (updateData: TBinanceDepthUpdate) => {
            const ob: TOrderBook = orderBook.update(updateData);
            this.pushOrderBook(coin, standardCoin, ob);
        });
    }

}
