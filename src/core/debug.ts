
const debugInfo: {[name: string]: any} = {
};

export function getDebugger(): any {
    return debugInfo;
}

export function setDebugger(key: string, value: any): void {
    debugInfo[key] = value;
}
