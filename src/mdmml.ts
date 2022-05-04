
const MThd = new Uint8Array([0x4D, 0x54, 0x68, 0x64])
const MTrk = new Uint8Array([0x4D, 0x54, 0x72, 0x6B])
const EOT = new Uint8Array([0x00, 0xFF, 0x2F, 0x00])

class MDMML {
    divisions = 960;
    title = '';
    tempo = 120;
    header: Uint8Array;
    Conductor: Track;
    Tracks: Track[] = [];
    constructor() {
        this.Conductor = new Track('', [], new Uint8Array())
        this.header = new Uint8Array()
    }
}

class Track {
    name = '';
    mmls: string[] = [];
    smf: Uint8Array;

    constructor(name: string, mmls: string[], smf: Uint8Array) {
        this.name = name
        this.mmls = mmls
        this.smf = smf
    }
}

class loop {
    pos = 0
    count = 0
    constructor(pos: number, count: number) {
        this.pos = pos
        this.count = count
    }
}

// chode
class note {
    num = 0
    vel = 0
}

export function MDtoSMF(md: string): ArrayBuffer {
    return SMF(MMLtoSMF(MDtoMML(md)))
}

function MDtoMML(md: string): MDMML {
    let mm = new MDMML;

    const lines = md.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] == "---") { // Front Matter
            i++
            for (; i < lines.length; i++) {
                if (lines[i] == "---") {
                    break
                }
                const items = lines[i].split(":")
                if (items.length > 2) {
                    items[1] = items.slice(1).join(":")
                } else if (items.length != 2) {
                    continue
                }
                if (items[0] == "Divisions") {
                    mm.divisions = atoi(items[1], 960)
                }
                if (items[0] == "Tempo") {
                    mm.tempo = atoi(items[1], 120)
                }
                if (items[0] == "Title") {
                    mm.title = items[1].trim()
                }
            }
        }
        if (lines[i].startsWith("|")) { // Table
            i++
            i++ // Skip header
            for (; i < lines.length; i++) {
                if (lines[i].trim() == "") {
                    break
                }
                if (lines[i].startsWith(";")) { // Comment
                    continue
                }
                const items = lines[i].split("|")
                if (items.length < 3) {
                    continue
                }
                const name = items[1].trim()
                let mmls: string[] = []
                for (let ii = 2; ii < items.length; ii++) {
                    mmls.push(items[ii].trim())
                }
                let found = false
                for (let j = 0; j < mm.Tracks.length; j++) {
                    const v = mm.Tracks[j]
                    if (v.name == name) {
                        for (let k = 0; k < mmls.length; k++) {
                            mm.Tracks[j].mmls.push(mmls[k])
                        }
                        found = true
                        break
                    }
                }
                if (!found) {
                    mm.Tracks.push(new Track(name, mmls, new Uint8Array()))
                }
            }
        }
    }
    return mm
}

function MMLtoSMF(mm: MDMML): MDMML {
    for (let i = 0; i < mm.Tracks.length; i++) {
        const t = mm.Tracks[i]
        const events = toEvents(expand(t.mmls.join("")), i, mm.divisions)
        mm.Tracks[i].smf = buildSMF(t.name, events, i)
    }
    mm.header = Uint8ArrayJoin([
        MThd,
        new Uint8Array([0x00, 0x00, 0x00, 0x06]),   // Length
        new Uint8Array([0x00, 0x01]),               // Format
        itofb(mm.Tracks.length + 1, 2),             // Tracks
        itofb(mm.divisions, 2)                      // Divisions
    ])

    const title = buildTitle(mm.title)
    const tempo = buildTempo(mm.tempo)
    const smf = Uint8ArrayJoin([
        MTrk,
        itofb(title.length + tempo.length + 12, 4),
        title,
        tempo,
        new Uint8Array([0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]),   // Rhythm 4/4
        EOT
    ])
    mm.Conductor = new Track('Conductor', [], smf)
    return mm
}

function SMF(mm: MDMML): ArrayBuffer {
    let smf = Uint8ArrayJoin([mm.header, mm.Conductor.smf])
    for (let i = 0; i < mm.Tracks.length; i++) {
        smf = Uint8ArrayJoin([smf, mm.Tracks[i].smf])
    }
    return smf
}

function atoi(a: string, def: number): number {
    const ret = Number(a)
    if (Number.isNaN(ret)) {
        return def
    }
    return ret
}

function expand(mml: string): string {
    let res = ''
    let loops: loop[] = []
    mml = mml.replaceAll(' ', '')
    mml += '   ' // インデックス超過対策
    for (let i = 0; i < mml.length; i++) {
        const s = mml[i]
        if (s == ' ') {
            break
        }
        if (s == '[') { // loop begin
            loops.push(new loop(i, -1))
        } else if (s == ']') { // loop end
            const [v, l] = num(mml.slice(i + 1), 1, 128)
            let c = 2
            if (l > 0) {
                i = i + l
                c = v
            }
            const lp = loops.length - 1
            if (loops[lp].count == -1) {
                loops[lp].count = c
            }
            if (loops[lp].count > 1) {
                loops[lp].count--
                i = loops[lp].pos
            } else {
                if (lp > 0) {
                    loops = loops.slice(0, lp - 1)
                }
            }
        } else {
            res += s
        }
    }
    return res
}

function toEvents(mml: string, ch: number, div: number): Uint8Array {
    //TODO
    return new Uint8Array();
}

function buildSMF(title: string, events: ArrayBuffer, ch: number): Uint8Array {
    //TODO
    return new Uint8Array();
}

function Uint8ArrayJoin(src: Uint8Array[]): Uint8Array {
    let len = 0
    for (let i = 0; i < src.length; i++) {
        len += src[i].length
    }
    let dest = new Uint8Array(len)
    let pos = 0
    for (let i = 0; i < src.length; i++) {
        dest.set(new Uint8Array(src[i]), pos)
        pos += src[i].length
    }
    return dest
}

// itofb は number を f 桁の固定長バイナリにして返す
function itofb(i: number, f: number): Uint8Array {
    if (i < 256) {
        if (f < 1) {
            f = 1
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i]), f - 1)
        return ret
    }
    if (i < 256 * 256) {
        if (f < 2) {
            f = 2
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 8]), f - 2)
        ret.set(new Uint8Array([i & 0xff]), f - 1)
        return ret
    }
    if (i < 256 * 256 * 256) {
        if (f < 3) {
            f = 3
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 16]), f - 3)
        ret.set(new Uint8Array([i >> 8]), f - 2)
        ret.set(new Uint8Array([i & 0xff]), f - 1)
        return ret
    }
    if (i < 256 * 256 * 256 * 256) {
        if (f < 4) {
            f = 4
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 24]), f - 4)
        ret.set(new Uint8Array([i >> 16]), f - 3)
        ret.set(new Uint8Array([i >> 8]), f - 2)
        ret.set(new Uint8Array([i & 0xff]), f - 1)
        return ret
    }
    return new Uint8Array()
}

function buildTitle(title: string): Uint8Array {
    return Uint8ArrayJoin([
        new Uint8Array([0x00, 0xff, 0x03]),
        itofb(title.length, 1),
        new TextEncoder().encode(title)
    ])
}

function buildTempo(tempo: number): Uint8Array {
    return Uint8ArrayJoin([
        new Uint8Array([0x00, 0xff, 0x51, 0x03]),
        itofb(tempoMs(tempo), 3)
    ])
}

function tempoMs(t: number): number {
    if (t == 0) {
        return 0
    }
    return Math.trunc(60 * 1000 * 1000 / t)
}

function num(s: string, min: number, max: number): [number, number] {
    let ss = ''
    for (let i = 0; i < s.length; i++) {
        const j = s[i]
        if (j >= '0' && j <= '9') {
            ss += j
        } else {
            break
        }
    }
    let n = Number(ss)
    if (Number.isNaN(n)) {
        return [0, 0]
    }
    if (n < min) {
        n = min
    }
    if (n > max) {
        n = max
    }
    return [n, ss.length]
}

// for Test
export {
    MDtoMML, MMLtoSMF, SMF, atoi, expand, toEvents, buildSMF, Uint8ArrayJoin,
    itofb, buildTitle, buildTempo, tempoMs, num
}
