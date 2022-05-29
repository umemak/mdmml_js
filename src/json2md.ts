export function JSONtoMD(json: string): string {
    let res = ""
    const js = JSON.parse(json).blocks
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
