
/*
 * log.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:50:26 GMT+0800 (CST)
 */

import * as log4js from 'log4js';

import { Configuration } from 'log4js';
import { TDPHConfig } from 'main-types';

/**
 * 每个进程一个logger
 */
let logger: log4js.Logger = {} as log4js.Logger;

export function initLogger(config: Configuration, moduleName: string = "main"): log4js.Logger {
    log4js.configure(config);
    logger = log4js.getLogger(moduleName);
    return logger
}

export function getLogger(): log4js.Logger {
    return logger;
}
