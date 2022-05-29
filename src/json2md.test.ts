import * as json2md from "./json2md"

describe("JSONtoMD", () => {
    const json = `
    {
        "time": 1653659512081,
        "blocks": [
            {
                "id": "eBorwO1TzJ",
                "type": "table",
                "data": {
                    "withHeadings": false,
                    "content": [
                        [
                            "111",
                            "222"
                        ],
                        [
                            "333",
                            "444"
                        ]
                    ]
                }
            }
        ],
        "version": "2.24.3"
    }    
    `
    const want = `|111|222|
|---|---|
|333|444|
`
    const cases = [
        { name: "bpm120", json: json, want: want },
    ]
    for (const { name, json, want } of cases) {
        test(name, () => {
            expect(json2md.JSONtoMD(json)).toBe(want)
        })
    }
})
