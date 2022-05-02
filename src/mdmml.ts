export function MDtoSMF(md: string): Uint8Array {
    let smf = new Uint8Array(md.length);
    for (var i=0;i<md.length;i++){
        smf[i]=md.codePointAt(i)!;
    }
    return smf;
}
