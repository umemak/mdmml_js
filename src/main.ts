import { MDtoSMF } from './mdmml';

interface Window { MDtoSMF(md: string): ArrayBuffer; }
declare var window: Window;
window.MDtoSMF = (md: string) => {
    return MDtoSMF(md);
};
