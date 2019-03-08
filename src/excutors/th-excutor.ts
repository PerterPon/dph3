
/*
 * dh-excutor.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Mon Feb 18 2019 20:58:58 GMT+0800 (CST)
 */

import { BaseExcutor } from 'src/excutors/base-excutor';
import { CCXTTrader } from 'src/traders/ccxt-trader';

import { TTHAction } from 'action-types';

export class THExcutor extends BaseExcutor {
    
    public async excute(actions: TTHAction[]): Promise<void> {
        const trader: CCXTTrader = await CCXTTrader.getInstrance();
        for (let i = 0; i < actions.length; i++) {
            const action: TTHAction = actions[i];
            await trader.excute(action);
        }
        // const tracker: THActionTracker = new THActionTracker;
        // await tracker.start();

    }

    public async excuteAction(action: TTHAction): Promise<void> {

    }

}
