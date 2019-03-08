
/*
 * base-trader.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 16:58:17 GMT+0800 (CST)
 */

import { TTHAction } from 'action-types';

export interface ITrader {
    init(): Promise<void>;
    buy(action: TTHAction): Promise<void>;
    sell(action: TTHAction): Promise<void>;
}

export class BaseTrader implements ITrader {

    public async init(): Promise<void> {
        
    }

    public async buy(action: TTHAction): Promise<void> {

    }

    public async sell(action: TTHAction): Promise<void> {

    }

}
