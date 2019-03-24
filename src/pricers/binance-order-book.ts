
/*
 * binance-order-book.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Mon Feb 18 2019 14:46:39 GMT+0800 (CST)
 */
import * as _ from 'lodash';

import { getLogger } from 'src/core/log';

import { BinanceConnection } from 'src/connections/binance-connection';
import { EOBType } from 'src/enums/main';

import { TOrderBook, TBinanceDepthUpdate } from "pricer-types";
import { Logger } from 'log4js';

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
            this.orderBook.asks = this.doUpdatePrice(updateData.a, this.orderBook.asks, EOBType.ASK);
            this.orderBook.bids = this.doUpdatePrice(updateData.b, this.orderBook.bids, EOBType.BID);
        }
        return this.orderBook;
    }

    private doUpdatePrice(newPrice: [number, number][], oldPrice: [number, number][], type: EOBType): [number, number][] {
        const goodPrice = (targetPrice: number, originalPrice: number) => {
            if (
                (EOBType.ASK === type && targetPrice < originalPrice) ||
                (EOBType.BID === type && targetPrice > originalPrice)
            ) {
                return true;
            }
            return false;
        }
        let firstPrice: number|undefined = _.get(oldPrice, '[0][0]');
        if (undefined === firstPrice) {
            if (EOBType.ASK === type) {
                firstPrice = Number.MAX_VALUE;
            } else if (EOBType.BID === type) {
                firstPrice = 0;
            }
        }

        for (let i = 0; i < newPrice.length; i ++) {
            let [ price, amount ] = newPrice[i];
            price = Number(price);
            amount = Number(amount);
            //1. amount is 0, remove price
            if (0 === amount) {
                _.remove(oldPrice, function(value: [number, number], index: number, collection: any):boolean {
                    if (value[0] === price) {
                        return true;
                    }
                    return false;
                });
            } else {
                //2. new best price, insert price to the first
                const needInsert = goodPrice(price, firstPrice);
                if (true === needInsert) {
                    oldPrice.unshift([price, amount]);
                } else {
                    // 3. check if the price already in order book
                    let updated: boolean = false;
                    for (let j = 0; j < oldPrice.length; j++) {
                        const [oldPriceNum] = oldPrice[j];
                        if (price === oldPriceNum) {
                            oldPrice[j][1] = amount;
                            updated = true;
                        }
                    }

                    // 4. if price did not exists, find a right place and insert it
                    if (false === updated) {
                        let inserted: boolean = false;
                        for (let j = 0; j < oldPrice.length; j++) {
                            const [oldPriceNum] = oldPrice[j];
                            const needInsert: boolean = goodPrice(price, oldPriceNum);
                            if (true === needInsert) {
                                oldPrice.splice(j, 0, [price, amount]);
                                inserted = true;
                                break;
                            }
                        }
                        if (false === inserted) {
                            oldPrice.push([price, amount]);
                        }
                    }
                }

            }
        }
        if (oldPrice.length >= 10) {
            oldPrice = oldPrice.slice(0, 10);
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