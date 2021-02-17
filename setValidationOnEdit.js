/*
Function get values from DropDowns sheet, then find in DDL sheet

@getSheetData needed
*/

// 0.0.9
function setValidation(source, current_row_index, sheet_name_shortcut) {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheetData_DDL = getSheetData(ss, _sheet_params.DDL.NAME)
    const as = source.getActiveSheet()
    const headers = as.getRange(1, 1, 1, as.getLastColumn()).getValues()[0]

    for (const dd of _dd_dependencies[sheet_name_shortcut]) {
        // ct('Set Validation')
        const dd_arr = sheetData_DDL.getMappedColumn(_cols_DDL[dd]).filter(r => r !== '')
        const col_name = _sheet_params[sheet_name_shortcut].COL_NAME[dd] || _cols_DDL[dd]
        const col_indexes = headers.flatMap((header, i) => header === col_name ? i + 1 : [])
        if (!!col_indexes) {
            for (const col_index of col_indexes) {
                const rule = SpreadsheetApp.newDataValidation().requireValueInList(dd_arr, true).build()
                as.getRange(current_row_index, col_index, 1, 1).setDataValidation(rule)
            }
        }
    }
}