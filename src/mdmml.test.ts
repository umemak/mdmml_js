import * as mdmml from "./mdmml"

describe("atoi", () => {
    const cases = [
        { name: "number", a: "1", def: 2, want: 1 },
        { name: "not number", a: "a", def: 2, want: 2 },
        { name: "not number mix", a: "1a", def: 2, want: 2 },
    ]
    for (const { name, a, def, want } of cases) {
        test(name, () => {
            expect(mdmml.atoi(a, def)).toBe(want)
        })
    }
})

describe("Uint8ArrayJoin", () => {
    const cases = [
        {
            name: "normal",
            src: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            want: new Uint8Array([1, 2, 3, 4, 5, 6])
        },
    ]
    for (const { name, src, want } of cases) {
        test(name, () => {
            expect(mdmml.Uint8ArrayJoin(src)).toStrictEqual(want)
        })
    }
})

describe("itofb", () => {
    const cases = [
        { name: "i<256 f1", i: 255, f: 1, want: new Uint8Array([0xff]) },
        { name: "i<256 f2", i: 255, f: 2, want: new Uint8Array([0x00, 0xff]) },
        { name: "i<65536 f1", i: 65535, f: 1, want: new Uint8Array([0xff, 0xff]) },
        { name: "i<65536 f3", i: 65535, f: 3, want: new Uint8Array([0x00, 0xff, 0xff]) },
        { name: "i<16777216 f1", i: 16777215, f: 1, want: new Uint8Array([0xff, 0xff, 0xff]) },
        { name: "i<16777216 f4", i: 16777215, f: 4, want: new Uint8Array([0x00, 0xff, 0xff, 0xff]) },
        { name: "i<4294967296 f1", i: 4294967295, f: 1, want: new Uint8Array([0xff, 0xff, 0xff, 0xff]) },
        { name: "i<4294967296 f5", i: 4294967295, f: 5, want: new Uint8Array([0x00, 0xff, 0xff, 0xff, 0xff]) },
        { name: "i<=4294967296 f1", i: 4294967296, f: 1, want: new Uint8Array() },
    ]
    for (const { name, i, f, want } of cases) {
        test(name, () => {
            expect(mdmml.itofb(i, f)).toStrictEqual(want)
        })
    }
})

describe("buildTitle", () => {
    const cases = [
        { name: "normal", title: "abc", want: [0x00, 0xff, 0x03, 0x03, 0x61, 0x62, 0x63] },
        { name: "empty", title: "", want: [0x00, 0xff, 0x03, 0x00] },
    ]
    for (const { name, title, want } of cases) {
        test(name, () => {
            expect(mdmml.buildTitle(title)).toStrictEqual(new Uint8Array(want))
        })
    }
})

describe("buildTempo", () => {
    const cases = [
        { name: "120", tempo: 120, want: [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20] },
    ]
    for (const { name, tempo, want } of cases) {
        test(name, () => {
            expect(mdmml.buildTempo(tempo)).toStrictEqual(new Uint8Array(want))
        })
    }
})

describe("tempoMs", () => {
    const cases = [
        { name: "bpm120", t: 120, want: 500000 },
        { name: "bpm140", t: 140, want: 428571 },
    ]
    for (const { name, t, want } of cases) {
        test(name, () => {
            expect(mdmml.tempoMs(t)).toBe(want)
        })
    }
})

describe("num", () => {
    const cases = [
        { name: "1桁", s: "1a", min: 1, max: 10, want: [1, 1] },
        { name: "2桁", s: "12a", min: 1, max: 15, want: [12, 2] },
        { name: "min", s: "12a", min: 20, max: 30, want: [20, 2] },
        { name: "max", s: "12a", min: 1, max: 10, want: [10, 2] },
    ]
    for (const { name, s, min, max, want } of cases) {
        test(name, () => {
            expect(mdmml.num(s, min, max)).toStrictEqual(want)
        })
    }
})

describe("expand", () => {
    const cases = [
        { name: "normal", mml: "cde", want: "cde" },
        { name: "loop", mml: "cr[cr][rd]3rd", want: "crcrcrrdrdrdrd" },
    ]
    for (const { name, mml, want } of cases) {
        test(name, () => {
            expect(mdmml.expand(mml)).toBe(want)
        })
    }
})

describe("lenToTick", () => {
    const cases = [
        { name: "div960 len8", div: 960, len: 8, want: 480 },
        { name: "div960 len4", div: 960, len: 4, want: 960 },
        { name: "div480 len8", div: 480, len: 8, want: 240 },
        { name: "div480 len4", div: 480, len: 4, want: 480 },
    ]
    for (const { name, div, len, want } of cases) {
        test(name, () => {
            expect(mdmml.lenToTick(div, len)).toBe(want)
        })
    }
})
