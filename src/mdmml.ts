
class MDMML {
    divisions = 960;
    title = '';
    tempo = 120;
    header = [];
    Conductor = Track;
    Tracks: Track[] = [];
}

class Track {
    name = '';
    mmls: string[] = [];
    smf = [];
}

export function MDtoSMF(md: string): Uint8Array {
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
                    let tk = new Track()
                    tk.name = name
                    tk.mmls = mmls
                    mm.Tracks.push(tk)
                }
            }
        }
    }
    return mm
}

function MMLtoSMF(mm: MDMML): MDMML {
    return mm
}

function SMF(mm: MDMML): Uint8Array {
    return new Uint8Array();
}

function atoi(a: string, def: number): number {
    const ret = Number(a)
    return ret
}
