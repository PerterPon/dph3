
/*
 * base-stratege.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 16:06:18 GMT+0800 (CST)
 */

import * as _ from 'lodash';

import { TTHAction } from 'action-types';
import { DPHCoin, StandardCoin, DPHExchange } from 'src/enums/main';
import { TOrderBook } from 'pricer-types';

export interface IStratege {
    init(): Promise<void>;
    priceUpdate(exchange: DPHExchange, coin: DPHCoin, standardCoin: StandardCoin, orderBook: TOrderBook): Promise<void>;
    fetchAction():Promise<TTHAction[]>;
}

export class BaseStratege implements IStratege {

    protected exchangeMap: Map<DPHExchange, Map<StandardCoin, Map<DPHCoin, TOrderBook>>> = new Map();

    private fnQueue: Function[] = [];

    public async init(): Promise<void> {

    }

    public async priceUpdate(exchange: DPHExchange, coin: DPHCoin, standardCoin: StandardCoin, orderBook: TOrderBook): Promise<void> {
        let standardCoinMap: Map<StandardCoin, Map<DPHCoin, TOrderBook>>|undefined = this.exchangeMap.get(exchange);
        if (undefined === standardCoinMap) {
            standardCoinMap = new Map();
            this.exchangeMap.set(exchange, standardCoinMap);
        }
        let coinMap: Map<DPHCoin, TOrderBook>|undefined = standardCoinMap.get(standardCoin);
        if (undefined === coinMap) {
            coinMap = new Map();
            standardCoinMap.set(standardCoin, coinMap);
        }
        coinMap.set(coin, orderBook);
        await this.pushPrice();
    }

    protected async pushPrice(): Promise<void> {
        
    }

    protected popPrice(actions: TTHAction[]): void {
        while(this.fnQueue.length) {
            const fn = this.fnQueue.pop();
            if (true === _.isFunction(fn)) {
                fn(actions);
            }
        }
    }

    public async fetchAction(): Promise<TTHAction[]> {
        return new Promise<TTHAction[]>((resolve) => {
            this.fnQueue.push(resolve);
        });
    }

}
