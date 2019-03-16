
/*
 * env.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 19:38:57 GMT+0800 (CST)
 */

import * as commander from 'commander';

import { initConfig, getConfig } from 'src/core/config';
import { initLogger } from 'src/core/log';

import { TDPHConfig } from 'main-types';

export async function initEnv(): Promise<void> {
    await initConfig(commander.env);
    const config: TDPHConfig = getConfig();
    initLogger(config.log);
}
