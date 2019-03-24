
/*
* bitfinex-order-book.ts
* Author: PerterPon<PerterPon@gmail.com>
* Create: Sun Mar 24 2019 15:05:29 GMT+0800 (CST)
*/

import * as _ from 'lodash';
import { Logger } from "log4js";

import { getLogger } from "src/core/log";

import { EOBType } from "src/enums/main";

import { TOrderBook } from "pricer-types";

export class BitfinexOrderBook {

    public orderBook: TOrderBook = {
        asks: [],
        bids: []
    };

    private orderPriceMap: Map<number, [number, number]> = new Map();

    public updateSnapshort(snapshort: [number, number, number][]): TOrderBook {
        for (let i = 0; i < snapshort.length; i++) {
            const item = snapshort[i];
            const [price, count, amount] = item;
            this.update(price, count, amount);
        }

        return this.orderBook;
    }

    public update(price: number, count: number, amount: number): TOrderBook {
        const orderBook: TOrderBook = this.orderBook;
        
        const logger: Logger = getLogger();
        let obType: EOBType;
        if (amount > 0) {
            obType = EOBType.BID;
        } else {
            obType = EOBType.ASK;
        }
        amount = Math.abs(amount);
        const nowPrice: [number, number] = [price, amount];
        if (0 === count) {
            nowPrice[1] = 0;
        }
        const asks: [number, number][] = orderBook.asks
        const bids: [number, number][] = orderBook.bids;
        if (EOBType.ASK === obType) {
            orderBook.asks = this.doUpdatePrice([nowPrice], asks, obType);
        } else if (EOBType.BID === obType) {
            orderBook.bids = this.doUpdatePrice([nowPrice], bids, obType);
        }
        this.orderBook = orderBook;
        return orderBook;

        // price === 0, means this order is closed
        // if (0 === count) {
        //     const originPriceAmount: [number, number]|undefined = this.orderPriceMap.get(orderId);
        //     this.orderPriceMap.delete(orderId);
        //     if (undefined === originPriceAmount) {
        //         logger.warn(`[BFX_ORDERBOOK] got order: [${orderId}] with 0 price, but can not find memory order book`);
        //         return orderBook;
        //     }
        //     nowPrice[0] = originPriceAmount[0];
        //     nowPrice[1] = originPriceAmount[1];
        //     // nowPrice[0] = originPriceAmount;
        //     // nowPrice[1] = -nowPrice[1];
        // } else {
        //     this.orderPriceMap.set(orderId, [price, amount]);
        // }

        // const asks: [number, number][] = orderBook.asks
        // const bids: [number, number][] = orderBook.bids;
        // if (EOBType.ASK === obType) {
        //     orderBook.asks = this.doUpdatePrice([nowPrice], asks, obType);
        // } else if (EOBType.BID === obType) {
        //     orderBook.bids = this.doUpdatePrice([nowPrice], bids, obType);
        // }
        // this.orderBook = orderBook;
        // return orderBook;
    }

    private goodPrice(targetPrice: number, originalPrice: number, type: EOBType): boolean {
        if (
            (EOBType.ASK === type && targetPrice < originalPrice) ||
            (EOBType.BID === type && targetPrice > originalPrice)
        ) {
            return true;
        }
        return false;
    }

    private doUpdatePrice(newPrice: [number, number][], oldPrice: [number, number][], type: EOBType): [number, number][] {
        let firstPrice: number | undefined = _.get(oldPrice, '[0][0]');
        let lastPrice: number|undefined = _.get(oldPrice, '[10][0]');
        if (undefined === firstPrice) {
            if (EOBType.ASK === type) {
                firstPrice = Number.MAX_VALUE;
            } else if (EOBType.BID === type) {
                firstPrice = 0;
            }
        }

        
        for (let i = 0; i < newPrice.length; i++) {
            let [price, amount] = newPrice[i];
            // if price bigger than the biggest ask, not need to go on
            if (
                (undefined !== lastPrice && amount > 0) &&
                (EOBType.ASK === type && price > lastPrice) ||
                (EOBType.BID === type && price < lastPrice)
            ) {
                continue;
            }
            price = Number(price);
            amount = Number(amount);
            //1. amount is 0, remove price
            if (0 === amount) {
                _.remove(oldPrice, function (value: [number, number], index: number, collection: any): boolean {
                    if (value[0] === price) {
                        return true;
                    }
                    return false;
                });
            } else {
                //2. new best price, insert price to the first
                const needInsert = this.goodPrice(price, firstPrice, type);
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
                            break;
                        }
                    }

                    // 4. if price did not exists, find a right place and insert it
                    if (false === updated) {
                        let inserted: boolean = false;
                        for (let j = 0; j < oldPrice.length; j++) {
                            const [oldPriceNum] = oldPrice[j];
                            const needInsert: boolean = this.goodPrice(price, oldPriceNum, type);
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

}
