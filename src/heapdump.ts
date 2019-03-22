
/*
 * heapdump.js
 * Author: PerterPon<PerterPon@gmail.com>
 * Create: Fri Mar 22 2019 15:34:48 GMT+0800 (CST)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

import { sleep } from 'src/util/index';

var profiler = require('v8-profiler');
var heapdump = require('heapdump');
const mkdirp = require('mkdirp');

const dumpFolder = path.join(__dirname, '../dump');

mkdirp(dumpFolder);


export async function start(): Promise<void> {

    while(true) {
        const now = moment().format('YYYY-MM-DD-HH:mm:ss');
        const profileName = `profile-${now}.heapsnapshot`;
        const profileFile = path.join(dumpFolder, profileName);
        const snapshot = profiler.takeSnapshot();
        snapshot.export((error: any, result: any) => {
            fs.writeFileSync(profileFile, result);
        });
        await sleep( 10 * 60 * 1000 );
    }

}

