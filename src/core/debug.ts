
/*
 * debug.ts
 * Author: PerterPon<PerterPon@gmail.com>
 * Create: Tue Mar 19 2019 11:13:27 GMT+0800 (CST)
 */

import * as fs from 'fs';
import * as path from 'path';

import { sleep } from 'src/util/index';

const filePath: string = path.join(__dirname, '../../debug_info.json');
let debugInfo: {[name: string]: any} = {
};
try {
    const debugFile: string = fs.readFileSync(filePath, 'utf-8');
    debugInfo = JSON.parse(debugFile);
} catch(e) {
    //ignore this
}

export function getDebugger(): any {
    return debugInfo;
}

export function setDebugger(key: string, value: any): void {
    debugInfo[key] = value;
}

// start debugging 
debugging();

async function debugging(): Promise<void> {
    while(true) {
        await sleep(10 * 1000);
        fs.writeFileSync(filePath, JSON.stringify(debugInfo, ' ' as any, 4));
    }
}
