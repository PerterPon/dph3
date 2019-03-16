
/*
 * bitfinex-connection.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Thu Feb 14 2019 11:56:57 GMT+0800 (CST)
 */

import { BaseConnection } from 'src/connections/base-connection';

const BFX = require('bitfinex-api-node');

const bfx = new BFX({
    ws: {
        autoReconnect: true,
        seqAudit: true,
        // packetWDDelay: 10 * 1000,
        manageOrderBooks: true
    }
});

export class BitfinexConnection extends BaseConnection {

    public static instance: BitfinexConnection = null;

    public static async getInstance(): Promise<BitfinexConnection> {
        if (null === this.instance) {
            this.instance = new BitfinexConnection();
            await this.instance.connect();
        }
        return this.instance;
    }

    public ws: any = null;

    public async connect(): Promise<void> {

        if (null !== this.ws) {
            return;
        }

        let resolveFn: Function = () => {};
        const ws = bfx.ws(2, {
            manageOrderBooks: true,
            transform: true
        });

        ws.on('error', this.onError.bind(this) );

        ws.on('open', () => {
            resolveFn();
        });

        ws.open();

        this.ws = ws;

        return new Promise<void>((resolve, reject) => {
            resolveFn = resolve;
        });

    }

    private onError(error:Error): void {
        console.log(error);
    }

}
