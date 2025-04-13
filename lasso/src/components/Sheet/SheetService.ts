import { SheetSpec } from "@site/src/services/models";


const parseActuationSheet = (sheet: SheetSpec) => {
    const matrix = loadSheetJsonl(sheet?.body)

    return matrix
}

function loadSheetJsonl(jsonl: any) {
    console.log(`body = ${jsonl}`)

    const sheetData: any[][] = []
    for (const line of jsonl.trim().split(/[\r\n]+/)) {
        if (!line) {
            continue;
        }
        //console.log(line);
        const row = JSON.parse(line + "")
        //sheetData.push({value: row.})

        const cols: any[] = Object.keys(row.cells).sort().map(key => {
            //console.log(`Property: ${key}, Value: ${row.cells[key]}`);

            let myVal = row.cells[key];
            if (myVal.toString() == "[object Object]") {
                myVal = "";
            }

            //console.log(`myVal: ${myVal}`);

            return { value: myVal, readOnly: false, className: "text-danger" }
        });

        sheetData.push(cols)
    }

    // make certain rows larger if necessary
    const maxLength = findLargestRow(sheetData)
    const matrix = sheetData.map((row) => {
        const nextRow = [...row];
        if (nextRow.length < maxLength) {
            let diff = maxLength - nextRow.length
            nextRow.length += diff;

            //console.log(nextRow.length)
        }
        return nextRow;
    })

    return matrix
}

function findLargestRow(sheetData: any[][]): number {
    let length = -1
    for (let i = 0; i < sheetData.length; i++) {
        const currentLength = sheetData[i].length

        if (currentLength > length) {
            length = currentLength
        }
    }

    return length
}

const SheetService = {
    parseActuationSheet
};

export default SheetService;