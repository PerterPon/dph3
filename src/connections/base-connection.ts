
/*
 * base-connection.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 15:02:33 GMT+0800 (CST)
 */

import * as EventEmitter from 'events';

export interface IBaseConnection {
    connect(): Promise<void>;
    send(data: string|Buffer): Promise<boolean>;
    close(): Promise<void>;
}

export abstract class BaseConnection extends EventEmitter implements IBaseConnection {

    protected host: string = '';
    protected port: number = 0;
    protected protocol: string = '';
    protected autoReconnected: boolean = true;

    public async connect(): Promise<void> {
    }

    public async send(data: string|Buffer): Promise<boolean> {
        return true;
    }

    public async close(): Promise<void> {
    }

}
