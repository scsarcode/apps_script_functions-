/*
    const params = {
        headers_num: Number,
        fixed_headers: Number,
        headers_row: Number,
        create_obj: Boolean,
        true_lr: $col_name OR 'all-empty' OR Boolean(false)
        row_index_show_in_obj: Boolean
    }


sub functions:
getMappedColumn — returns array by $col_name

Replacing changed values in object (not all rows in sheet)
Returns value in sheetData.ReplacedRows
replaceValuesInRows

Merged with rows in sheetData.Obj
Can be chunked after replaceValuesInRows or returns values
getMergedData

Parsing to sheet from object
Can be chunked after getMergedData
parseToSheet


*/

// v1.1.1
function getSheetData(spreadSheet, target_sheet_name, sheet_params) {
    const params_true_lr_all_empty = 'all-empty'
    const params = {
        headers_num: 1,
        fixed_headers: 1,
        headers_row: 1,
        create_obj: true,
        true_lr: params_true_lr_all_empty,
        row_index_show_in_obj: true,

        ...sheet_params
    }
    if (params.fixed_headers < params.headers_num) {
        params.fixed_headers = params.headers_num
    }
    const sheet = spreadSheet.getSheetByName(target_sheet_name) || 'error'
    let sheetData = {};
    sheetData['sheet'] = sheet
    sheetData['sheetName'] = target_sheet_name
    sheetData['sheetParams'] = params
    sheetData['lc'] = sheet.getLastColumn()
    sheetData['lr'] = sheet.getLastRow()
    sheetData['Range_All'] = sheet.getRange(1, 1, sheetData['lr'], sheetData['lc'])
    sheetData['Values'] = sheetData['Range_All'].getValues()
    const slice_start_row = params.headers_row - 1
    const headers = sheetData['Values'].slice(slice_start_row, (slice_start_row + params.headers_num))
    params.headers_num === 1 ? sheetData['Headers'] = headers[0] : sheetData['Headers'] = headers
    if (params.true_lr) {
        (params.true_lr === params_true_lr_all_empty
            ? sheetData['true_lr'] = _getTrueLastRow()
            : sheetData['true_lr'] = _getTrueLastRow_byColumn())
        sheetData['lr'] = sheetData['true_lr']
        sheetData['Values'] = sheetData['Values'].slice(0, sheetData['lr'])
    }
    if (params.create_obj) {
        sheetData['Obj'] = _createObjectWithHeaders()
    }

    sheetData['getMappedColumn'] = function (col_name) {
        if (!col_name) {
            throw new Error(`getMappedColumn: Column Name is NOT DEFINED!`)
        }
        const col_index = this.Headers.indexOf(col_name)
        if (col_index < 0) {
            throw new Error(`getMappedColumn: Column ${col_name} NOT FOUND!`)
        }
        const mapped_col = this.Values.map(r => r[col_index]).slice(this.sheetParams.headers_num)
        return mapped_col
    }

    sheetData['replaceValuesInRows'] = function (new_rows_obj, by_col_name) {
        if (!new_rows_obj || !by_col_name) {
            throw new Error(`replaceValuesInRows: new_rows_obj OR new_rows_obj is NOT DEFINED!`)
        }
        const sheetData_replaceValuesInRows = []
        const sheetData_obj = this.Obj
        for (const new_row of new_rows_obj) {
            for (let i = 0; i < sheetData_obj.length; i++) {
                const original_row = sheetData_obj[i]
                if (new_row[by_col_name] === original_row[by_col_name]) {
                    sheetData_obj[i] = {
                        ...original_row,
                        ...new_row
                    }
                    sheetData_replaceValuesInRows.push(sheetData_obj[i])
                }
            }
        }
        cs({sheetData_replaceValuesInRows})
        this.ReplacedRows = sheetData_obj
        return this
    }

    sheetData['getMergedData'] = function (obj_modified) {
        if (!obj_modified && !this.ReplacedRows) {
            throw new Error(`getMergedData: obj_modified OR ReplacedRows NOT DEFINED!`)
        }
        const modified = obj_modified || this.ReplacedRows
        const sheetData_getMergedData = this.Obj
        for (const row_obj of modified) {
            if (!row_obj.sheetData_row_index) {
                throw new Error(`getMergedData: sheetData_row_index in modified obj NOT FOUND: ${row_obj}`)
            }
            const index = row_obj.sheetData_row_index - this.sheetParams.fixed_headers - 1
            sheetData_getMergedData[index] = {
                ...sheetData_getMergedData[index],
                ...row_obj
            }
        }
        cs({sheetData_getMergedData})
        this.MergedData = sheetData_getMergedData
        if (obj_modified) {
            return sheetData_getMergedData
        } else {
            return this
        }
    }

    sheetData['parseToSheet'] = function (object_to_parse) {
        if (!object_to_parse && !this.MergedData) {
            throw new Error(`parseToSheet: object_to_parse is NOT DEFINED!`)
        }
        const object_to_parse_ = object_to_parse || this.MergedData
        const sheetData_parseToSheet = []
        for (const row_obj of object_to_parse_) {
            const index = row_obj.sheetData_row_index - this.sheetParams.fixed_headers
            const row_arr = this.Values[index]
            for (const [row_obj_col_name, row_obj_value] of Object.entries(row_obj)) {
                const index = this.Headers.indexOf(row_obj_col_name)
                if (index < 0) {
                    continue;
                }
                row_arr[index] = row_obj_value
            }
            sheetData_parseToSheet.push(row_arr)
        }
        cs({sheetData_parseToSheet})

        this.sheet
            .getRange(this.sheetParams.fixed_headers + 1, 1, sheetData_parseToSheet.length, sheetData_parseToSheet[0].length)
            .setValues(sheetData_parseToSheet)
        SpreadsheetApp.flush()
        return true
    }


    function _getTrueLastRow() {
        let lr_index_;
        for (let i = sheetData['Values'].length - 1; i >= 0; i--) {
            lr_index_ = i;
            if (!sheetData.Values[i].every(el => (el === ""))) {
                break;
            }
        }
        return lr_index_ + 1
    }

    function _getTrueLastRow_byColumn() {
        const col_index_ = sheetData['Headers'].indexOf(params.true_lr)
        if (col_index_ < 0) {
            throw new Error(`_getTrueLastRow_byColumn: Column ${params.true_lr} NOT FOUND!`);
        }
        let lr_index_
        const values_ = sheetData['Values'].map(r => r[col_index_])
        for (let i = values_.length - 1; i >= 0; i--) {
            lr_index_ = i
            if (values_[i] !== '') {
                break;
            }
        }
        return lr_index_ + 1
    }

    function _createObjectWithHeaders() {
        const header_index_ = params.headers_row
        const skip_rows_ = params.fixed_headers
        const end_rows_ = sheetData['lr']
        const headers_ = sheetData.Values[header_index_ - 1]
        const rows_data_ = sheetData['Values'].slice(skip_rows_, end_rows_)
        const output_obj_ = rows_data_.map((r, m_i) => {
            let obj_ = {};
            r.forEach((cell, i) => {
                obj_[headers_[i]] = cell;
            })
            if (params.row_index_show_in_obj) {
                obj_['sheetData_row_index'] = skip_rows_ + (m_i + 1)
            }
            return obj_
        })
        return output_obj_
    }
    return sheetData
}
