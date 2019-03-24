
/*
 * connection.d.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 15:47:47 GMT+0800 (CST)
 */


declare module "connection-types" {

    import { EBFXEvent, EBFXChannel } from 'src/enums/main';

    export type TConnectionConfig = {
        host: string;
        port: string;
        protocl: string;
    };

    export interface TBFXOrderChannel {
        event: EBFXEvent;
        channel: EBFXChannel;
        symbol: string;
        prec?: string;
    }

    /** bitfinex received message */
    export interface TBFXRecevedMessage {
        event: EBFXEvent;
        version: number;
        channel: EBFXChannel;
    }

    /** book received message */
    export interface TBFXBookRecevedMessage extends TBFXRecevedMessage {
        chanId: number;
        prec: string;
        freq: string;
        symbol: string;
    }

    /** BFX OB data fromate, [chnnelId, [price, orderCount, +-amount]] */
    export type TBFXOBData = [number, [number, number, number]];

    /** BFX heart beat */
    export type TBFXheartBeat = [number, 'hb'];

}
