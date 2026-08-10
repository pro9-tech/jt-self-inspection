/**
 * Consolidated Google Apps Script for Filling & Packaging Records
 * 
 * Logic:
 * 1. '중량' Sheet: Only Filling1 Weight data
 * 2. '그 외' Sheet: Everything else (Cap, Sticker, Printing, Scratch, Foreign)
 * 
 * Writing style: Appends one row per record measurement (line by line).
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("Error: No data received").setMimeType(ContentService.MimeType.TEXT);
    }
    
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure sheets exist
    var weightSheet = ss.getSheetByName("중량");
    if (!weightSheet) {
      weightSheet = ss.insertSheet("중량");
      weightSheet.appendRow(["충진일", "품목명", "로트번호", "측정시간", "구분", "정식중량(g)", "미달허용(g)", "초과허용(g)", "Vial 1", "Vial 2", "Vial 3", "평균", "판정", "작업자", "확인자", "메모"]);
      weightSheet.getRange(1, 1, 1, 16).setBackground("#f3f3f3").setFontSize(10);
    }
    
    var otherSheet = ss.getSheetByName("그 외");
    if (!otherSheet) {
      otherSheet = ss.insertSheet("그 외");
      otherSheet.appendRow(["충진일", "품목명", "로트번호", "측정시간", "구분", "Vial 1", "Vial 2", "Vial 3", "평균", "판정", "작업자", "확인자", "메모"]);
      otherSheet.getRange(1, 1, 1, 13).setBackground("#f3f3f3").setFontSize(10);
    }

    data.measurements.forEach(function(m) {
      // 1. Process Filling1 Weight
      if (data.mainMode === '충진' && data.subMode === '충진1') {
        var weights = m.vials || [null, null, null];
        if (weights.some(function(v) { return v !== null && v !== ""; })) {
           var weightRes = getWeightResult(weights, data.standardWeight, data.underweightTolerance, data.overweightTolerance);
           // Average field for weight sheet now shows judgement (정상/불량)
           var weightJudge = (weightRes === "적합" ? "정상" : "불량");
           var newRow = [
             data.fillingDate, data.itemName, data.lotNumber, m.time, "중량",
             data.standardWeight, data.underweightTolerance, data.overweightTolerance,
             weights[0] || "-", weights[1] || "-", weights[2] || "-", weightJudge, weightRes,
             data.verifier, data.operator, m.vialMemo || ""
           ];
           appendAndStyle(weightSheet, newRow, data, weights);
        }
        
        // Cap status for Filling1 goes to "그 외"
        var caps = m.capStatus || [null, null, null];
        if (caps.some(function(v) { return v !== null && v !== ""; })) {
          var statusRes = getStatusResult(caps);
          var newRow = [
            data.fillingDate, data.itemName, data.lotNumber, m.time, "캡(충진1)",
            caps[0] || "-", caps[1] || "-", caps[2] || "-", (statusRes === "적합" ? "정상" : "불량"), statusRes,
            data.verifier, data.operator, m.capMemo || ""
          ];
          appendAndStyle(otherSheet, newRow, null, null);
        }
      } 
      
      // 2. Process Filling2
      else if (data.mainMode === '충진' && data.subMode === '충진2') {
          var stickers = m.stickerStatus || [null, null, null];
          if (stickers.some(function(v) { return v !== null && v !== ""; })) {
            var resStatus = getStatusResult(stickers);
            var newRow = [
              data.fillingDate, data.itemName, data.lotNumber, m.time, "스티커(충진2)",
              stickers[0] || "-", stickers[1] || "-", stickers[2] || "-", (resStatus === "적합" ? "정상" : "불량"), resStatus,
              data.verifier, data.operator, m.stickerMemo || ""
            ];
            appendAndStyle(otherSheet, newRow, null, null);
          }
          var prints = m.printingStatus || [null, null, null];
          if (prints.some(function(v) { return v !== null && v !== ""; })) {
            var resStatus = getStatusResult(prints);
            var newRow = [
              data.fillingDate, data.itemName, data.lotNumber, m.time, "날인(충진2)",
              prints[0] || "-", prints[1] || "-", prints[2] || "-", (resStatus === "적합" ? "정상" : "불량"), resStatus,
              data.verifier, data.operator, m.printingMemo || ""
            ];
            appendAndStyle(otherSheet, newRow, null, null);
          }
      } 
      
      // 3. Process Packaging
      else if (data.mainMode === '포장') {
         var labels = ["날인(포장)", "캡(포장)", "스티커(포장)", "스크래치(포장)", "이물(포장)"];
         var statusArrays = [m.printingStatus, m.capStatus, m.stickerStatus, m.scratchStatus, m.foreignStatus];
         var memoFields = ["printingMemo", "capMemo", "stickerMemo", "scratchMemo", "foreignMemo"];
         
         labels.forEach(function(label, idx) {
           var arr = statusArrays[idx] || [null, null, null];
           if (arr.some(function(v) { return v !== null && v !== ""; })) {
             var resStatus = getStatusResult(arr);
             var memo = m[memoFields[idx]] || "";
             var newRow = [
               data.fillingDate, data.itemName, data.lotNumber, m.time, label,
               arr[0] || "-", arr[1] || "-", arr[2] || "-", (resStatus === "적합" ? "정상" : "불량"), resStatus,
               data.verifier, data.operator, memo
             ];
             appendAndStyle(otherSheet, newRow, null, null);
           }
         });
      }
    });

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Appends a row and applies formatting:
 * 1. Left alignment for all cells.
 * 2. All text BOLD.
 * 3. Blue for Overweight.
 * 4. Red for Underweight, 불량, 부적합.
 * 5. Numbers formatted to at least 1 decimal place.
 */
function appendAndStyle(sheet, rowData, weightData, weights) {
  sheet.appendRow(rowData);
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange(lastRow, 1, 1, rowData.length);
  
  // Basic Formatting: Left align + 10pt font
  range.setHorizontalAlignment("left");
  range.setFontSize(10);
  range.setFontWeight("normal");
  range.setFontColor("#000000"); // Default Black
  
  // Conditional Formatting (Coloring) & Number Formatting
  for (var i = 0; i < rowData.length; i++) {
    var cellValue = rowData[i];
    var cell = range.getCell(1, i + 1);
    
    // Explicitly set number format for numeric inputs to preserve .0
    if (typeof cellValue === 'number') {
      cell.setNumberFormat("0.0");
    }
    
    // Check for "불량" or "부적합"
    if (cellValue === "불량" || cellValue === "부적합") {
      cell.setFontColor("#ff0000"); // Red
    }
    
    // Check specific weight values if it's the weight sheet logic
    // weightSheet columns (1-indexed): 1:충진일, 2:품목명, 3:로트번호, 4:측정시간, 5:구분, 6:정식, 7:미달, 8:초과, 9:V1, 10:V2, 11:V3, 12:평균, 13:판정
    if (weightData && i >= 8 && i <= 10) {
      var val = Number(cellValue);
      if (!isNaN(val) && cellValue !== "-" && cellValue !== "") {
        if (val < (weightData.standardWeight - weightData.underweightTolerance)) {
          cell.setFontColor("#ff0000"); // Red (Underweight)
        } else if (val > (weightData.standardWeight + weightData.overweightTolerance)) {
          cell.setFontColor("#0000ff"); // Blue (Overweight)
        }
      }
    }
  }
}

function getAverage(vials) {
  var sum = 0;
  var count = 0;
  vials.forEach(function(v) {
    if (v !== null && v !== "") {
      sum += Number(v);
      count++;
    }
  });
  if (count === 0) return "-";
  return (sum / count).toFixed(1);
}

/**
 * Updated Logic:
 * Fail Count < 2 -> 적합 (Pass)
 * Fail Count >= 2 -> 부적합 (Fail)
 */
function getWeightResult(vials, std, under, over) {
  var count = 0;
  var failCount = 0;
  vials.forEach(function(v) {
    if (v !== null && v !== "") {
      count++;
      if (v < (std - under) || v > (std + over)) failCount++;
    }
  });
  if (count === 0) return "-";
  return failCount < 2 ? "적합" : "부적합";
}

/**
 * Updated Logic:
 * Fail Count < 2 -> 적합 (Pass)
 * Fail Count >= 2 -> 부적합 (Fail)
 */
function getStatusResult(arr) {
  var count = 0;
  var failCount = 0;
  arr.forEach(function(v) {
    if (v !== null && v !== "") {
      count++;
      if (v === "불량") failCount++;
    }
  });
  if (count === 0) return "-";
  return failCount < 2 ? "적합" : "부적합";
}

function getFailCount(arr, type, std, under, over) {
  var fails = 0;
  arr.forEach(function(v) {
    if (v === null || v === "") return;
    if (type === 'weight') {
      if (v < (std - under) || v > (std + over)) fails++;
    } else {
      if (v === "불량") fails++;
    }
  });
  return fails;
}
