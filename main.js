let defaultRowCount = 7; // No of rows
let defaultColCount = 5; // No of cols
let defaultColNames = ["Layer", "Kernel size", "Padding", "Stride", "Dilation", "Output"];
let defaultColValues = [NaN, NaN, 0, 1, 1, NaN];
const SPREADSHEET_DB = "spreadsheet_db";

initializeData = () => {
  const data = [];
  for (let i = 0; i <= defaultRowCount; i++) {
    const child = [];
    for (let j = 0; j <= defaultColCount; j++) {
      child.push("");
    }
    data.push(child);
  }
  return data;
};

getData = () => {
  let data = localStorage.getItem(SPREADSHEET_DB);
  if (data === undefined || data === null) {
    return initializeData();
  }
  return JSON.parse(data);
};

saveData = data => {
  localStorage.setItem(SPREADSHEET_DB, JSON.stringify(data));
};

resetData = data => {
  localStorage.removeItem(SPREADSHEET_DB);
  this.createSpreadsheet();
};


// TABLE ====================================================================

createHeaderRow = () => {
  const tr = document.createElement("tr");
  tr.setAttribute("id", "h-0");
  for (let i = 0; i <= defaultColCount; i++) {
    const th = document.createElement("th");
    th.setAttribute("id", `h-0-${i}`);
    th.setAttribute("class", `${i === 0 ? "" : "column-header"}`);
    // th.innerHTML = i === 0 ? `` : `Col ${i}`;
    if (i !== 0) {
      const span = document.createElement("span");
      span.innerHTML = defaultColNames[i];
      // span.innerHTML = `Colonne ${i}`;
      span.setAttribute("class", "column-header-span");
      const dropDownDiv = document.createElement("div");
      dropDownDiv.setAttribute("class", "dropdown");
      dropDownDiv.innerHTML = `<button class="dropbtn" id="col-dropbtn-${i}">+</button>
        <div id="col-dropdown-${i}" class="dropdown-content">
          <p class="col-insert-left">Insert 1 column left</p>
          <p class="col-insert-right">Insert 1 column right</p>
          <p class="col-delete">Delete column</p>
        </div>`;
      th.appendChild(span);
      th.appendChild(dropDownDiv);
    }
    tr.appendChild(th);
  }
  return tr;
};

createTableBodyRow = rowNum => {
  const tr = document.createElement("tr");
  tr.setAttribute("id", `r-${rowNum}`);
  for (let i = 0; i <= defaultColCount; i++) {
    const cell = document.createElement(`${i === 0 ? "th" : "td"}`);
    if (i === 0) {
      cell.contentEditable = false;
      // content
      const span = document.createElement("span");
      span.innerHTML = (rowNum >= 2) ? rowNum - 1 : "layer";
      cell.appendChild(span);
      // dropdown div
      if (rowNum >= 2) {
        const dropDownDiv = document.createElement("div");
        dropDownDiv.setAttribute("class", "dropdown");
        dropDownDiv.innerHTML = `<button class="dropbtn" id="row-dropbtn-${rowNum}">+</button>
          <div id="row-dropdown-${rowNum}" class="dropdown-content">
            <p class="row-insert-top">Insert 1 row above</p>
            <p class="row-insert-bottom">Insert 1 row below</p>
            <p class="row-duplicate">Duplicate row</p>
            <p class="row-delete">Delete row</p>
          </div>`;
        cell.appendChild(dropDownDiv);
      } else {
        cell.style.backgroundColor = "#f5f5f5";
      }
      cell.setAttribute("class", "row-header");
    } else if (i === defaultColCount || rowNum === 1) {
      // console.log(cell.style)
      cell.contentEditable = false;
      cell.style.backgroundColor = "#f5f5f5";
      if (rowNum === 1 && i === defaultColCount) {
        cell.style.borderColor = "#73c62a";
        cell.style.borderWidth = "2px";
        cell.style.borderRadius = "2px";
      } else if (rowNum === defaultRowCount) {
        cell.style.borderColor = "#f88787";
        cell.style.borderWidth = "2px";
        cell.style.borderRadius = "2px";
      }
    } else {
      cell.contentEditable = true;
    }
    cell.setAttribute("id", `r-${rowNum}-${i}`);
    // cell.id = `${rowNum}-${i}`;
    tr.appendChild(cell);
  }
  return tr;
};

createTableBody = tableBody => {
  for (let rowNum = 1; rowNum <= defaultRowCount; rowNum++) {
    tableBody.appendChild(this.createTableBodyRow(rowNum));
  }
};

// Fill Data in created table from localstorage
populateTable = () => {
  const data = this.getData();
  if (data === undefined || data === null) return;

  for (let i = 1; i < data.length; i++) {
    for (let j = 1; j < data[i].length; j++) {
      const cell = document.getElementById(`r-${i}-${j}`);
      cell.innerHTML = data[i][j];
    }
  }
  // put input/output values into table
  let inputItem = document.getElementById("table-input");
  inputItem.innerHTML = data[1][defaultColCount];
  let outputItem = document.getElementById("table-output");
  outputItem.innerHTML = data[defaultRowCount][defaultColCount];
};

// Get a value
getValue = (data_row, name) => {
  let tableValue = Number(data_row[defaultColNames.indexOf(name)]);
  let trueValue = (
    (tableValue == "") ?
    defaultColValues[defaultColNames.indexOf(name)] :
    tableValue
    );
  return trueValue;
}

// Formula for output
computeDimension = (data_i0, data_i1) => {
  let inp = getValue(data_i0, "Output");
  let ker = getValue(data_i1, "Kernel size");
  let pad = getValue(data_i1, "Padding");
  let str = getValue(data_i1, "Stride");
  let dil = getValue(data_i1, "Dilation");
  let out = Math.trunc((inp + 2*pad - ker - (ker-1)*(dil-1)) / str) + 1;
  return out;
};

// Compute cell values
computeCells = () => {
  const data = this.getData();
  for (let i = 2; i < data.length; i++) {
    data[i][defaultColNames.indexOf("Output")] = computeDimension(data[i-1], data[i]);
  }
  saveData(data);
  let item = document.getElementById("table-output");
  item.innerHTML = data[defaultRowCount][defaultColCount];
  this.createSpreadsheet();
};

// MODIFY ROWS ================================================================

// Utility function to add or duplicate row
addRow = (currentRow, direction, action) => {
  if (currentRow === -1) {  // add at the very bottom
    currentRow = defaultRowCount;
  }
  let data = this.getData();
  const colCount = data[0].length;
  let newRow;
  if (action === "insert") {
    newRow = new Array(colCount).fill("");
  } else if (action === "duplicate") {
    newRow = data[currentRow].slice();
  }
  if (direction === "top") {
    data.splice(currentRow, 0, newRow);
  } else if (direction === "bottom") {
    data.splice(currentRow + 1, 0, newRow);
  }
  defaultRowCount++;
  saveData(data);
  computeCells();
  this.createSpreadsheet();
};

// Utility function to delete row
deleteRow = currentRow => {
  let data = this.getData();
  data.splice(currentRow, 1);
  defaultRowCount--;
  saveData(data);
  computeCells();
  this.createSpreadsheet();
};

// MODIFY COLUMNS =============================================================

// Utility function to add columns
addColumn = (currentCol, direction) => {
  let data = this.getData();
  for (let i = 0; i <= defaultRowCount; i++) {
    if (direction === "left") {
      data[i].splice(currentCol, 0, "");
    } else if (direction === "right") {
      data[i].splice(currentCol + 1, 0, "");
    }
  }
  defaultColCount++;
  if (direction === "left") {
    defaultColNames.splice(currentCol, 0, "GAUCHE");
    defaultColValues.splice(currentCol, 0, null);
  } else if (direction === "right") {
    defaultColNames.splice(currentCol + 1, 0, "DROITE");
    defaultColValues.splice(currentCol + 1, 0, null);
  }
  saveData(data);
  this.createSpreadsheet();
};

// Utility function to delete column
deleteColumn = currentCol => {
  let data = this.getData();
  for (let i = 0; i <= defaultRowCount; i++) {
    data[i].splice(currentCol, 1);
  }
  defaultColCount++;
  defaultColNames.splice(currentCol, 1);
  defaultColValues.splice(currentCol, 1);
  saveData(data);
  this.createSpreadsheet();
};

// CREATE SHEET ===============================================================

createSpreadsheet = () => {
  const spreadsheetData = this.getData();
  defaultRowCount = spreadsheetData.length - 1 || defaultRowCount;
  defaultColCount = spreadsheetData[0].length - 1 || defaultColCount;

  const tableHeaderElement = document.getElementById("table-headers");
  const tableBodyElement = document.getElementById("table-body");
  const tableInputElement = document.getElementById("table-input");

  const tableBody = tableBodyElement.cloneNode(true);
  tableBodyElement.parentNode.replaceChild(tableBody, tableBodyElement);
  const tableHeaders = tableHeaderElement.cloneNode(true);
  tableHeaderElement.parentNode.replaceChild(tableHeaders, tableHeaderElement);
  const tableInput = tableInputElement.cloneNode(true);
  tableInputElement.parentNode.replaceChild(tableInput, tableInputElement);

  tableHeaders.innerHTML = "";
  tableBody.innerHTML = "";
  tableBody.innerHTML = "";

  tableHeaders.appendChild(createHeaderRow(defaultColCount));
  createTableBody(tableBody, defaultRowCount, defaultColCount);

  populateTable();

  // attach focusout event listener to whole table body container
  tableBody.addEventListener("focusout", function(e) {
    if (e.target && e.target.nodeName === "TD") {
      let item = e.target;
      const indices = item.id.split("-");
      let spreadsheetData = getData();
      spreadsheetData[indices[1]][indices[2]] = item.innerHTML
        .replaceAll("<br>", "")
        .replaceAll("&nbsp;", "")
        .replaceAll(/[^0-9]/g, "");
      saveData(spreadsheetData);
      computeCells();
    }
  });

  // attach focusout event listener to input table
  tableInput.addEventListener("focusout", function(e) {
    if (e.target && e.target.nodeName === "TD") {
      let item = e.target;
      let spreadsheetData = getData();
      spreadsheetData[1][defaultColCount] = item.innerHTML
        .replaceAll("<br>", "")
        .replaceAll("&nbsp;", "")
        .replaceAll(/[^0-9]/g, "");
      saveData(spreadsheetData);
      computeCells();
    }
  });

  // Attach click event listener to table body
  tableBody.addEventListener("click", function(e) {
    if (e.target) {
      if (e.target.className === "dropbtn") {
        const idArr = e.target.id.split("-");
        document
          .getElementById(`row-dropdown-${idArr[2]}`)
          .classList.toggle("show");
      }
      if (e.target.className === "row-insert-top") {
        const indices = e.target.parentNode.id.split("-");
        addRow(parseInt(indices[2]), "top", "insert");
      }
      if (e.target.className === "row-insert-bottom") {
        const indices = e.target.parentNode.id.split("-");
        addRow(parseInt(indices[2]), "bottom", "insert");
      }
      if (e.target.className === "row-duplicate") {
        const indices = e.target.parentNode.id.split("-");
        addRow(parseInt(indices[2]), "top", "duplicate");
      }
      if (e.target.className === "row-delete") {
        const indices = e.target.parentNode.id.split("-");
        deleteRow(parseInt(indices[2]));
      }
    }
  });
  // Attach click event listener to table headers
  tableHeaders.addEventListener("click", function(e) {
    if (e.target) {
      if (e.target.className === "column-header-span") {
        console.log("sorting");
      }
      if (e.target.className === "dropbtn") {
        const idArr = e.target.id.split("-");
        document
          .getElementById(`col-dropdown-${idArr[2]}`)
          .classList.toggle("show");
      }
      if (e.target.className === "col-insert-left") {
        const indices = e.target.parentNode.id.split("-");
        addColumn(parseInt(indices[2]), "left");
      }
      if (e.target.className === "col-insert-right") {
        const indices = e.target.parentNode.id.split("-");
        addColumn(parseInt(indices[2]), "right");
      }
      if (e.target.className === "col-delete") {
        const indices = e.target.parentNode.id.split("-");
        deleteColumn(parseInt(indices[2]));
      }
    }
  });

};

createSpreadsheet();

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

document.getElementById("reset").addEventListener("click", e => {
  if (
    confirm("This will erase all data and set default configs. Are you sure?")
  ) {
    this.resetData();
  }
});

document.getElementById("addrow").addEventListener("click", e => {
  this.addRow(-1, "bottom", "insert");
});

document.getElementById("load").addEventListener("click", e => {
  console.log("try to add template, json");
  item = document
      .getElementById(`picheee`);
  console.log(item.innerHTML);
  // https://stackoverflow.com/questions/29534538/save-array-javascript
});
