import * as mdmml from "./mdmml"

test('atoi: number', () => {
    expect(mdmml.atoi("1", 2)).toBe(1)
})

test('atoi: not number', () => {
    expect(mdmml.atoi("a", 2)).toBe(2)
})

test('atoi: not number mix', () => {
    expect(mdmml.atoi("1a", 2)).toBe(2)
})

test('Uint8ArrayJoin: normal', () => {
    const src1 = new Uint8Array([1, 2, 3])
    const src2 = new Uint8Array([4, 5, 6])
    const want = new Uint8Array([1, 2, 3, 4, 5, 6])
    expect(mdmml.Uint8ArrayJoin([src1, src2])).toStrictEqual(want)
})

test('itofb: i<256 f1', () => {
    expect(mdmml.itofb(255, 1)).toStrictEqual(new Uint8Array([0xff]))
})

test('itofb: i<256 f2', () => {
    expect(mdmml.itofb(255, 2)).toStrictEqual(new Uint8Array([0x00, 0xff]))
})

test('itofb: i<65536 f1', () => {
    expect(mdmml.itofb(65535, 1)).toStrictEqual(new Uint8Array([0xff, 0xff]))
})

test('itofb: i<65536 f3', () => {
    expect(mdmml.itofb(65535, 3)).toStrictEqual(new Uint8Array([0x00, 0xff, 0xff]))
})

test('itofb: i<16777216 f1', () => {
    expect(mdmml.itofb(16777215, 1)).toStrictEqual(new Uint8Array([0xff, 0xff, 0xff]))
})

test('itofb: i<16777216 f4', () => {
    expect(mdmml.itofb(16777215, 4)).toStrictEqual(new Uint8Array([0x00, 0xff, 0xff, 0xff]))
})

test('itofb: i<4294967296 f1', () => {
    expect(mdmml.itofb(4294967295, 1)).toStrictEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]))
})

test('itofb: i<4294967296 f5', () => {
    expect(mdmml.itofb(4294967295, 5)).toStrictEqual(new Uint8Array([0x00, 0xff, 0xff, 0xff, 0xff]))
})

test('itofb: i<=4294967296 f1', () => {
    expect(mdmml.itofb(4294967296, 1)).toStrictEqual(new Uint8Array())
})

test('buildTitle: normal', () => {
    expect(mdmml.buildTitle('abc')).toStrictEqual(new Uint8Array([0x00, 0xff, 0x03, 0x03, 0x61, 0x62, 0x63]))
})

test('buildTitle: empty', () => {
    expect(mdmml.buildTitle('')).toStrictEqual(new Uint8Array([0x00, 0xff, 0x03, 0x00]))
})

test('buildTempo: 120', () => {
    expect(mdmml.buildTempo(120)).toStrictEqual(new Uint8Array([0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20]))
})

test('tempoMs: bpm120', () => {
    expect(mdmml.tempoMs(120)).toBe(500000)
})

test('tempoMs: bpm140', () => {
    expect(mdmml.tempoMs(140)).toBe(428571)
})

test('num: 1桁', () => {
    expect(mdmml.num('1a', 1, 10)).toStrictEqual([1, 1])
})

test('num: 2桁', () => {
    expect(mdmml.num('12a', 1, 15)).toStrictEqual([12, 2])
})

test('num: min', () => {
    expect(mdmml.num('12a', 20, 30)).toStrictEqual([20, 2])
})

test('num: max', () => {
    expect(mdmml.num('12a', 1, 10)).toStrictEqual([10, 2])
})

test('expand: normal', () => {
    expect(mdmml.expand('cde')).toBe('cde')
})

test('expand: loop', () => {
    expect(mdmml.expand('cr[cr][rd]3rd')).toBe('crcrcrrdrdrdrd')
})

test('lenToTick: div960 len8', () => {
    expect(mdmml.lenToTick(960, 8)).toBe(480)
})

test('lenToTick: div960 len4', () => {
    expect(mdmml.lenToTick(960, 4)).toBe(960)
})

test('lenToTick: div480 len8', () => {
    expect(mdmml.lenToTick(480, 8)).toBe(240)
})

test('lenToTick: div480 len4', () => {
    expect(mdmml.lenToTick(480, 4)).toBe(480)
})
