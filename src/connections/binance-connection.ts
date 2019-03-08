
/*
 * binance-connection.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Sun Feb 17 2019 18:50:13 GMT+0800 (CST)
 */

import { BaseConnection } from 'src/connections/base-connection';

const NodeBinance = require('node-binance-api');

export class BinanceConnection extends BaseConnection {

    public static instance: BinanceConnection = null;

    public static async getInstance(): Promise<BinanceConnection> {
        if (null === this.instance) {
            this.instance = new BinanceConnection();
            await this.instance.connect();
        }
        return this.instance;
    }

    public ws: any = null;

    public async connect(): Promise<void> {
        const binance: any = new NodeBinance();
        this.ws = binance;
    }

}
