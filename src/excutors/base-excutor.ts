import { TTHAction } from "action-types";

/*
 * base-excutor.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Mon Feb 18 2019 20:58:23 GMT+0800 (CST)
 */

export interface IExcutor {
    init(): Promise<void>;
    excute(actions: TTHAction[]): Promise<void>;
}

export abstract class BaseExcutor implements IExcutor {
    public async init(): Promise<void> {
        
    }

    public async excute(actions: TTHAction[]): Promise<void> {

    }
}