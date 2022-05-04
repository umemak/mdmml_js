
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

    constructor(num: number, vel: number) {
        this.num = num
        this.vel = vel
    }
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
    mml = mml.replace(/ /g, '')
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
    let events = new Uint8Array
    let oct = 4
    let vel = 100
    let defTick = lenToTick(div, 8)
    mml = mml.toLowerCase()
    mml = mml.replace(/ /g, '')
    mml = mml.replace(/#/g, '+')
    mml += '   ' // インデックス超過対策
    for (let i = 0; i < mml.length; i++) {
        let s = mml[i]
        if (s == ' ') {
            break
        }
        if ((s >= 'a' && s <= 'g') || (s == 'r')) { // note
            let tick = defTick
            if (mml[i + 1] == '+') {
                i++
                s += '+'
            } else if (mml[i + 1] == '-') {
                i++
                s += '-'
            }
            const [v, l] = num(mml.slice(i + 1), 1, div)
            if (l > 0) {
                i += l
                tick = lenToTick(div, v)
            }
            if (mml[i + 1] == '.') {
                i++
                tick = Math.trunc(tick * 1.5)
            }
            for (; ;) {
                if (mml[i + 1] != '^') {
                    break
                }
                i++
                let tick2 = 0
                const [v, l] = num(mml.slice(i + 1), 1, div)
                if (l > 0) {
                    i += l
                    tick2 = lenToTick(div, v)
                }
                if (mml[i + 1] == '.') {
                    i++
                    tick2 = Math.trunc(tick * 1.5)
                }
                tick += tick2
            }
            events = Uint8ArrayJoin([events, noteOnOff(ch, oct, s, vel, tick)])
        } else if (s == "{") { // chode
            const cp = mml.indexOf("}", i + 1)
            const cmml = mml.slice(i + 1, i + cp + 1) + "   "
            i = i + cp + 1
            let notes: note[] = []
            let o = oct
            for (let j = 0; j < cmml.length; j++) {
                let s = cmml[j]
                if (s == " ") {
                    break
                }
                if (cmml[j + 1] == "+") {
                    j++
                    s += "+"
                } else if (cmml[j + 1] == "-") {
                    j++
                    s += "-"
                } else if (s == ">") {
                    o++
                    continue
                } else if (s == "<") {
                    o--
                    continue
                }
                const n = noteNum(o, s)
                notes.push(new note(n, vel))
            }
            let tick = defTick
            const [v, l] = num(mml.slice(i + 1), 1, div)
            if (l > 0) {
                i += l
                tick = lenToTick(div, v)
            }
            if (mml[i + 1] == ".") {
                i++
                tick = Math.trunc(tick * 1.5)
            }
            for (; ;) {
                if (mml[i + 1] != "^") {
                    break
                }
                i++
                let tick2 = 0
                const [v, l] = num(mml.slice(i + 1), 1, div)
                if (l > 0) {
                    i += l
                    tick2 = lenToTick(div, v)
                }
                if (mml[i + 1] == ".") {
                    i++
                    tick2 = Math.trunc(tick * 1.5)
                }
                tick += tick2
            }
            events = Uint8ArrayJoin([events, notesOnOff(ch, notes, tick)])
        } else if (s == "o") { // octave
            const [v, l] = num(mml.slice(i + 1), 1, 8)
            if (l > 0) {
                i = i + l
                oct = v
            }
        } else if (s == ">") {
            oct++
        } else if (s == "<") {
            oct--
        } else if (s == "l") { // length
            const [v, l] = num(mml.slice(i + 1), 1, div)
            if (l > 0) {
                i = i + l
                defTick = lenToTick(div, v)
            }
        } else if (s == "@") { // program
            const [v, l] = num(mml.slice(i + 1), 1, 128)
            if (l > 0) {
                i = i + l
            }
            events = Uint8ArrayJoin([events, programChange(ch, v)])
        } else if (s == "p") { // pan
            const [v, l] = num(mml.slice(i + 1), 0, 127)
            if (l > 0) {
                i = i + l
            }
            events = Uint8ArrayJoin([events, cc(0, ch, 10, v)])
        } else if (s == "t") { // tempo
            const [v, l] = num(mml.slice(i + 1), 1, 960)
            if (l > 0) {
                i = i + l
            }
            events = Uint8ArrayJoin([events, buildTempo(v)])
        } else if (s == "v") { // velocity
            const [v, l] = num(mml.slice(i + 1), 0, 127)
            if (l > 0) {
                i = i + l
                vel = v
            }
        } else if (s == "$") { // channel
            const [v, l] = num(mml.slice(i + 1), 1, 16)
            if (l > 0) {
                i = i + l
                ch = v - 1
            }
        }
    }
    return events
}

function buildSMF(title: string, events: Uint8Array, ch: number): Uint8Array {
    const body = Uint8ArrayJoin([
        buildTitle(title),// Title
        new Uint8Array([0x00, 0xFF, 0x20, 0x01]),// Channel
        itob(ch, 0),// Channel
        new Uint8Array([0x00, 0xFF, 0x21, 0x01]),// Port
        itob(ch, 0),// Port
        cc(0, ch, 121, 0),// CC#121(Reset)
        cc(0, ch, 7, 100),// CC#7(Volume)
        events,
        EOT
    ])
    return Uint8ArrayJoin([
        MTrk,
        itofb(body.length, 4),// Length
        body
    ])
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

function lenToTick(div: number, len: number): number {
    return Math.trunc(div * 4 / len)
}

function noteOnOff(ch: number, oct: number, note: string, vel: number, tick: number): Uint8Array {
    if (note == 'r') {
        // 無音を再生
        return Uint8ArrayJoin([
            midievent(0, 0x90 + ch, 0, 0),// on
            midievent(tick, 0x80 + ch, 0, 0)// off
        ])
    }
    const n = noteNum(oct, note)
    return Uint8ArrayJoin([
        midievent(0, 0x90 + ch, n, vel),// on
        midievent(tick, 0x80 + ch, n, 0)// off
    ])
}

function midievent(dt: number, ev: number, n: number, vel: number): Uint8Array {
    return Uint8ArrayJoin([
        itob(dt, 0),
        itofb(ev, 1),
        itofb(n, 1),
        itofb(vel, 1)
    ])
}

// itob は number を f 桁の可変長バイナリにして返す
// http://www13.plala.or.jp/kymats/study/MULTIMEDIA/midiStream_format.html
function itob(i: number, f: number): Uint8Array {
    if (i < 128) {
        if (f < 1) {
            f = 1
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i]), f - 1)
        return ret
    }
    if (i < 128 * 128) {
        if (f < 2) {
            f = 2
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 7 | 0x80]), f - 2)
        ret.set(new Uint8Array([i & 0x7f]), f - 2)
        return ret
    }
    if (i < 128 * 128 * 128) {
        if (f < 3) {
            f = 3
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 14 | 0x80]), f - 3)
        ret.set(new Uint8Array([i >> 7 | 0x80]), f - 2)
        ret.set(new Uint8Array([i & 0x7f]), f - 2)
        return ret
    }
    if (i < 128 * 128 * 128 * 128) {
        if (f < 4) {
            f = 4
        }
        let ret = new Uint8Array(f)
        ret.set(new Uint8Array([i >> 21 | 0x80]), f - 4)
        ret.set(new Uint8Array([i >> 14 | 0x80]), f - 3)
        ret.set(new Uint8Array([i >> 7 | 0x80]), f - 2)
        ret.set(new Uint8Array([i & 0x7f]), f - 2)
        return ret
    }
    return new Uint8Array()
}

function noteNum(oct: number, note: string): number {
    const cd = new Map<string, number>([
        ["c-", -1], ["c", 0], ["c+", 1],
        ["d-", 1], ["d", 2], ["d+", 3],
        ["e-", 3], ["e", 4], ["e+", 5],
        ["f-", 4], ["f", 5], ["f+", 6],
        ["g-", 6], ["g", 7], ["g+", 8],
        ["a-", 8], ["a", 9], ["a+", 10],
        ["b-", 10], ["b", 11], ["b+", 12],
    ])
    if (note == "r") {
        return -1
    }
    const val = cd.get(note)
    if (val == undefined) {
        return 0
    }
    return (oct + 1) * 12 + val
}

function notesOnOff(ch: number, notes: note[], tick: number): Uint8Array {
    let ret = new Uint8Array()
    for (let i = 0; i < notes.length; i++) {
        const n = notes[i]
        ret = Uint8ArrayJoin([ret, midievent(0, 0x90 + ch, n.num, n.vel)]) // on
    }
    for (let i = 0; i < notes.length; i++) {
        const n = notes[i]
        if (i == 0) {
            ret = Uint8ArrayJoin([ret, midievent(tick, 0x80 + ch, n.num, 0)]) // off
        } else {
            ret = Uint8ArrayJoin([ret, midievent(0, 0x80 + ch, n.num, 0)]) // off
        }
    }
    return ret
}

function programChange(ch: number, p: number): Uint8Array {
    return Uint8ArrayJoin([
        cc(0, ch, 0, 0),// CC#0(MSB)
        cc(0, ch, 32, 0),// CC#32(LSB)
        new Uint8Array([0x00]),
        itofb(0xC0 + ch, 1),
        itob(p - 1, 0)
    ])
}

function cc(dt: number, ch: number, num: number, val: number): Uint8Array {
    return Uint8ArrayJoin([
        itob(dt, 0),
        itofb(0xB0 + ch, 1),
        itofb(num, 1),
        itofb(val, 1)
    ])
}

// for Test
export {
    MDtoMML, MMLtoSMF, SMF, atoi, expand, toEvents, buildSMF, Uint8ArrayJoin,
    itofb, buildTitle, buildTempo, tempoMs, num, lenToTick, noteOnOff, midievent,
    itob, noteNum, notesOnOff, programChange, cc
}
