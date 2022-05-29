import { MDtoSMF } from './mdmml';
import { JSONtoMD } from './json2md';

interface Window {
    MDtoSMF(md: string): ArrayBuffer;
    JSONtoMD(json: string): string;
}

declare var window: Window;

window.MDtoSMF = (md: string) => {
    return MDtoSMF(md);
};

window.JSONtoMD = (json: string) => {
    return JSONtoMD(json);
};
