import { MDtoSMF } from './mdmml';

export { MDtoSMF };

console.log(Buffer.from(MDtoSMF("cdefg")).toString("binary"));
