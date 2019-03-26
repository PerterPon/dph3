
/*
 * huobipro-connection.ts
 * Author: PerterPon<PerterPon@gmail.com>
 * Create: Tue Mar 26 2019 12:09:28 GMT+0800 (CST)
 */

import * as _ from 'lodash';
import * as WebSocket from 'ws';
import * as pako from 'pako';

import { BaseConnection } from 'src/connections/base-connection';
import { THuobiproOrder, THuobiproOBData } from 'connection-types';
import { Logger } from 'log4js';
import { getLogger } from 'src/core/log';
import { TOrderBook } from 'pricer-types';
import { sleep } from 'src/util';

export class HuobiproConnection extends BaseConnection {
    public static instance: HuobiproConnection = null;

    public static async getInstance(): Promise<HuobiproConnection> {
        if (null === this.instance) {
            this.instance = new HuobiproConnection();
            await this.instance.connect();
        }
        return this.instance;
    }

    public ws: WebSocket;

    protected host: string = 'api.huobi.pro/ws';
    protected port: number = 443;

    private topicCBMap: Map<string, Function[]> = new Map();

    public async connect(): Promise<void> {
        const ws: WebSocket = new WebSocket(`wss://${this.host}`);
        let resover: (value?: void) => {};

        ws.on('open', () => {
            resover();
        });

        ws.on('message', this.onMessage.bind(this));
        ws.on('error', (error: Error) => {
            const logger: Logger = getLogger();
            logger.error(error);
            this.reconnection();
        });

        this.ws = ws;
        return new Promise<void>((resolve) => {
            resover = resolve as (value: void) => {};;
        });
    }

    public subscribeOrderBook(symbol: string): void {
        const topic: string = this.getTopicBySymbol(symbol);
        const orderObj: THuobiproOrder = {
            sub: topic
        };
        const reqData: string = JSON.stringify(orderObj);
        this.sendData(reqData);
    }

    public onOrderBook(opts: { symbol: string }, cb: (orderBook: TOrderBook) => void): void {
        const topic: string = this.getTopicBySymbol(opts.symbol);
        let fnList: Function[] | undefined = this.topicCBMap.get(topic);
        if (undefined === fnList) {
            fnList = [];
        }
        fnList.push(cb);
        this.topicCBMap.set(topic, fnList);
    }

    private getTopicBySymbol(symbol: string): string {
        return `market.${symbol}.depth.step0`;
    }

    private sendData(data: string): void {
        this.ws.send(data);
    }

    private onMessage(data: Buffer): void {
        const result: string = pako.inflate(data, {'to': 'string'});
        let resData: any;
        try {
            resData =  JSON.parse(result);
        } catch(e) {
            // parse response data with error, ignore it
            return;
        }

        // ping message
        if (true === _.isNumber(resData.ping)) {
            this.pong(resData.ping);
        } else if (true === _.isString(resData.subbed)) {
            // sub topic with success
        } else if (true === _.isString(resData.ch)) {
            // topic data
            this.onOBData(resData as THuobiproOBData)
        }
    }

    private onOBData(obData: THuobiproOBData): void {
        const ch: string = obData.ch;
        const fnList: Function[]|undefined = this.topicCBMap.get(ch);
        if (undefined === fnList) {
            const logger: Logger = getLogger();
            logger.error(`[HUOBIPRO_CONNECTION] get ob data with topic: [${ch}], but can not get registed callback`);
            return;
        }
        const orderBook: TOrderBook = {
            asks: obData.tick.asks,
            bids: obData.tick.bids
        };
        for (let i = 0; i < fnList.length; i++) {
            const fn: Function = fnList[i];
            fn(orderBook);
        }
    }

    private pong(id: number): void {
        this.sendData(JSON.stringify({
            pong: id
        }));
    }

    private async reconnection(): Promise<void> {
        const logger: Logger = getLogger();
        logger.warn('[HUOBIPRO_CONNECTION] reconnect after 3\'s');
        if (this.ws) {
            try {
                this.ws.close();
            } catch(e) {}
            this.ws = null;
        }

        await sleep(3 * 1000);
        await this.connect();
    }
}
