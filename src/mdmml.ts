
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
    mmls = [];
    smf = [];
}

export function MDtoSMF(md: string): Uint8Array {
    return SMF(MMLtoSMF(MDtoMML(md)))
}

function MDtoMML(md:string):MDMML{
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
/*
                for _, ii := range items[2 : len(items) - 1] {
                    mmls = append(mmls, strings.Trim(ii, " "))
                }
                found:= false
                for i, v := range mm.Tracks {
                    if v.name == name {
                        mm.Tracks[i].mmls = append(mm.Tracks[i].mmls, mmls...)
                        found = true
                        break
                    }
                }
                if !found {
                    mm.Tracks = append(mm.Tracks, Track{
                        name: name,
                        mmls: mmls,
                    })
                }
*/
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
