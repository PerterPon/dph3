
/*
 * bitfinex-connection-ws.ts
 * Author: PerterPon<PerterPon@gmail.com>
 * Create: Fri Mar 22 2019 18:02:34 GMT+0800 (CST)
 */

import * as _ from 'lodash';
import * as WebSocket from 'ws';
import * as Debug from 'debug';
import chalk from 'chalk';
import { Logger } from 'log4js';

import { BaseConnection } from 'src/connections/base-connection';
import { sleep } from 'src/util';
import { getLogger, testLog } from 'src/core/log';

import { EBFXEvent, EBFXChannel } from 'src/enums/main';

import { TBFXOrderChannel, TBFXBookRecevedMessage, TBFXRecevedMessage, TBFXOBData, TBFXheartBeat } from 'connection-types';

const debug: Debug.Debugger = Debug('bfx-connection');

export class BitfinexConnection extends BaseConnection {

    public static instance: BitfinexConnection = null;

    public static async getInstance(): Promise<BitfinexConnection> {
        if (null === this.instance) {
            this.instance = new BitfinexConnection();
            await this.instance.connect();
        }
        return this.instance;
    }

    public ws: WebSocket;

    protected host: string = 'api.bitfinex.com/ws/2';
    protected port: number = 443;

    private channelMap: Map<number, string> = new Map();
    private symbolCBMap: Map<string, Function[]> = new Map();
    private channelUpdateTime: Map<number, Date> = new Map();

    private shouldLiveCheck: boolean = false;

    constructor() {
        super();
        // this.liveCheck();
    }

    public async connect(): Promise<void> {
        let resover: (value?: void) => {};
        const ws: WebSocket = new WebSocket(`wss://${this.host}`);
        debug(`connect bfx ws connection with config: [wss://${this.host}]`);

        ws.on('open', () => {
            debug(`bfx ws connection open success`);
            this.shouldLiveCheck = true;
            resover();
        });
        ws.on('message', this.onMessage.bind(this));
        ws.on('error', (error) => {
            const logger: Logger = getLogger();
            logger.error(`[BFX_WS_CONNECTION] bfx connect with error: [${error.message}]!`);
            this.reconnection();
        });
        this.ws = ws;

        return new Promise<void>((resolve, reject) => {
            resover = resolve as (value: void) => {};
        });
    }

    public subscribeOrderBook(symbol: string): void {
        debug(`bfx subscribe order book with symbol: [${symbol}]`);
        const subscribeInfo: TBFXOrderChannel = {
            event: EBFXEvent.SUBSCRIBE,
            channel: EBFXChannel.BOOK,
            // prec: 'R0',
            symbol
        };
        this.ws.send(JSON.stringify(subscribeInfo));
    }

    public onOrderBook(opts: {symbol: string}, cb: (data: [number, number, number]) => void): void {
        let fnList: Function[]|undefined = this.symbolCBMap.get(opts.symbol);
        if (undefined === fnList) {
            fnList = [];
        }
        fnList.push(cb);
        this.symbolCBMap.set(opts.symbol, fnList);
    }

    private onMessage(msg: any): void {
        debug(`bfx got ws message: [${msg}]`);
        testLog(`[connections/bitfinex-connection-ws] onMessage, msg: [${msg}]`);
        let recevedMessage: any = null;
        try {
            recevedMessage = JSON.parse(msg);
        } catch(e) {
            const logger: Logger = getLogger();
            logger.error(chalk.red(`got bfx ws message error: [${e.message}]`));
            // parse message with error, just return.
            return;
        }

        // ob data
        if (true === _.isEmpty(recevedMessage.event)) {
            // try if this is a heart beat message
            const hbData: TBFXheartBeat = recevedMessage as TBFXheartBeat;
            if ( 'hb' === hbData[1]) {
                this.dealHeartBeatMsg(hbData[0]);
            } else {
                this.dealObDataMsg(recevedMessage);
            }
        } else {
            this.dealEventDataMsg(recevedMessage);
        }
    }

    /**
     * deal heart beat message
     * @param channelId 
     */
    private dealHeartBeatMsg(channelId: number): void {
        this.channelUpdateTime.set(channelId, new Date);
    }

    /**
     * deal order book data message
     * @param data 
     */
    private dealObDataMsg(data: TBFXOBData): void {
        testLog(`[connections/bitfinex-connection-ws] dealObDataMsg, data: [${JSON.stringify(data)}]`);
        const channelId: number = data[0];
        const symbol: string|undefined = this.channelMap.get(channelId);
        const logger: Logger = getLogger();
        // this.channelUpdateTime.set(channelId, new Date);
        if (undefined === symbol) {
            logger.error(`[BFX_WS_CONNECTION] receive channel: [${channelId}] ob data, but can not found symbol info`);
            return;
        }

        const fnList: Function[]|undefined = this.symbolCBMap.get(symbol);
        if (undefined === fnList) {
            logger.error(`[BFX_WS_CONNECTION] receive channel: [${channelId}] with symbol: [${symbol}], but can not found callbacks`);
            return;
        }
        for (let i = 0; i < fnList.length; i++) {
            const fn = fnList[i];
            fn(data[1]);
        }
    }

    /**
     * deal event data message
     * @param data 
     */
    private dealEventDataMsg(data: TBFXRecevedMessage): void {
        const event: EBFXEvent = data.event;
        switch (event) {
            case EBFXEvent.SUBSCRIBED:
                const subData: TBFXBookRecevedMessage = data as TBFXBookRecevedMessage;
                const channelId: number = subData.chanId;
                const symbol: string = subData.symbol;
                this.channelMap.set(channelId, symbol);
                debug(`[BFX_WS_CONNECTION] symbol: [${symbol}] subscribe success, channel id: [${channelId}]`);
                break;
            case EBFXEvent.INFO:
                debug(`[BFX_WS_CONNECTION] ws connect success: [${JSON.stringify(data)}]`);
                break;
            case EBFXEvent.ERROR:
                const logger: Logger = getLogger();
                logger.error(`[BFX_WS_CONNECTION] error event: [${JSON.stringify(data)}]`);
                break;
            default:
                break;
        }
    }

    private async reconnection(): Promise<void> {
        debug(`[BFX_WS_CONNECTION] reconnect after 3's`);
        const logger: Logger = getLogger();
        logger.warn('[BFX_WS_CONNECTION] reconnect after 3\'s');
        this.shouldLiveCheck = false;
        this.clean();
        await sleep(3 * 1000);
        await this.connect();
    }

    private clean() {
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {}
        }
        this.ws = null;
        this.channelMap = new Map();
        this.channelUpdateTime = new Map();
    }

    private async liveCheck(): Promise<void> {
        while (true) {
            await sleep(8 * 1000);
            if (true === this.shouldLiveCheck) {
                // TODO: add live check logic
            }
        }
    }

}

// async function start() {
//     const connection: BitfinexConnection = new BitfinexConnection();
//     await connection.connect();
//     connection.subscribeOrderBook('tBTCUSD');
//     connection.onOrderBook({
//         symbol: 'tBTCUSD'
//     }, (data: [number, number, number]) => {
//         console.log('-----', data);
//     });
// }

// start();
