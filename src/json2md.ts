export function JSONtoMD(json: string): string {
    let res = ""
    const js = JSON.parse(unescapeHtm(json)).blocks
    for (let i = 0; i < js.length; i++) {
        const e = js[i]
        if (e.type == "table") {
            const c = e.data.content
            for (let j = 0; j < c.length; j++) {
                res += "|"
                res += c[j].join("|")
                res += "|\n"
                if (j == 0) {
                    res += "|"
                    for (let k = 0; k < c[j].length; k++) {
                        res += "---|"
                    }
                    res += "\n"
                }
            }
        }
    }
    return res
}

function unescapeHtm(src: string): string {
    const patterns = new Map<string, string>([
        ['&lt;', '<'],
        ['&gt;', '>'],
        ['&amp;', '&'],
        ['&quot;', '"'],
        ['&#x27;', '\''],
        ['&#x60;', '`'],
    ])

    return src.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, function (match: string): string {
        const ret = patterns.get(match)
        if (ret == undefined) {
            return ""
        }
        return ret
    })
}
