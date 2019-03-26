
/*
 * huobipro-pricer.ts
 * Author: PerterPon<PerterPon@gmaail.com>
 * Create: Tue Mar 26 2019 14:23:30 GMT+0800 (CST)
 */

import * as _ from 'lodash';

import { BasePricer } from 'src/pricers/base-pricer';
import { DPHExchange, DPHCoin, StandardCoin } from 'src/enums/main';
import { HuobiproConnection } from 'src/connections/huobipro-connection';
import { TOrderBook } from 'pricer-types';

export class HuobiproPricer extends BasePricer {

    public pricerName: string = 'huobipro';
    public exchangeName: DPHExchange = DPHExchange.HUOBIPRO;

    private connection: HuobiproConnection = null;

    public async init(): Promise<void> {
        this.connection = await HuobiproConnection.getInstance();
    }

    public async registerCoin(coin: DPHCoin, standardCoin: StandardCoin): Promise<void> {
        const coinSymbol: string = this.fetchSymbol(coin, standardCoin);
        if (undefined === coinSymbol) {
            const error: Error = new Error(`trying to register coin: [${coin}], standard coin: [${standardCoin}], but could not found symbol`);
            throw error;
        }

        this.connection.subscribeOrderBook(coinSymbol);
        this.connection.onOrderBook({
            symbol: coinSymbol
        }, (orderBook: TOrderBook) => {
            this.pushOrderBook(coin, standardCoin, orderBook);
        });
    }

}
