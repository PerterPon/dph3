
/*
 * binance-order-book.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Mon Feb 18 2019 14:46:39 GMT+0800 (CST)
 */
import * as _ from 'lodash';

import { TOrderBook, TBinanceDepthUpdate } from "pricer-types";

import { BinanceConnection } from 'src/connections/binance-connection';
import { Logger, getLogger } from 'log4js';

export class BinanceOrderBook {

    public symbol: string = '';

    public orderBook: TOrderBook = {
        asks: [],
        bids: []
    };

    private lastUpdateId: number = 0;
    private lastu: number = 0;

    public async init(symbol: string): Promise<void> {
        this.symbol = symbol;
        await this.fetchSnapshot();
    }

    public update(updateData: TBinanceDepthUpdate): TOrderBook {
        if (updateData.u < this.lastUpdateId) {
            return;
        }
        if (0 === this.lastu) {
            this.lastu = updateData.u;
        } else if (updateData.U < this.lastu + 1) {
            const logger: Logger = getLogger();
            logger.warn(`get binance update but U: [${updateData.U}] did not match last u: [${this.lastu}], symbol: [${this.symbol}]`);
        } else {
            this.lastu = updateData.U;
            this.orderBook.asks = this.doUpdatePrice(updateData.a, this.orderBook.asks);
            this.orderBook.bids = this.doUpdatePrice(updateData.b, this.orderBook.bids);
        }
        return this.orderBook;
    }

    private doUpdatePrice(newPrice: [number, number][], oldPrice: [number, number][]): [number, number][] {
        for (let i = 0; i < newPrice.length; i ++) {
            const [ price, amount ] = newPrice[i];
            if (0 === Number(amount)) {
                _.remove(oldPrice, function(value: [number, number], index: number, collection: any):boolean {
                    if (value[0] === price) {
                        return true;
                    }
                    return false;
                });
            } else {
                _.map(oldPrice, (value: [number, number], index: number, collection: any) => {
                    if (value[0] === price) {
                        value[1] = amount;
                    }
                    return value;
                });
            }
        }
        return oldPrice;
    }

    private async fetchSnapshot(): Promise<void> {
        const connection: BinanceConnection = await BinanceConnection.getInstance();
        const binance: any = connection.ws;
        let resolveFn: Function = null;
        binance.depth(this.symbol, (error: Error, data: any) => {
            if (false === _.isEmpty(error)) {
                throw error;
            }
            this.lastUpdateId = data.lastUpdateId;
            this.orderBook.asks = this.translateOrderBook(data.asks);
            this.orderBook.bids = this.translateOrderBook(data.bids);
            if (true === _.isFunction(resolveFn)) {
                resolveFn();
            }
        });
        return new Promise<void>((resolve, reject) => {
            resolveFn = resolve;
        });
    }

    private translateOrderBook(priceList: any): [number, number][] {
        const result: [number, number][] = [];
        for (let price in priceList) {
            const amount = priceList[price];
            result.push([
                Number(price),
                Number(amount)
            ]);
        }
        return result;
    }

}