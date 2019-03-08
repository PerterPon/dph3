
/*
 * config.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 15:43:04 GMT+0800 (CST)
 */

import * as _ from 'lodash';

import * as Util from 'src/util';

import { TDPHConfig } from 'main-types';

let config: TDPHConfig = {} as TDPHConfig;

export async function initConfig(env?: string): Promise<TDPHConfig> {
    config = await Util.parseDPHConfig(env);

    return config;
}

export function getConfig(): TDPHConfig {
    if (true === _.isEmpty(config)) {
        const error: Error = new Error('config is null!');
        throw error;
    }

    return config;
}