function $(name) {
    return document.getElementById(name);
}

class Entry {
    constructor(name, location, amount) {
        this.entryName = name;
        this.location = location;
        this.amount = amount;
    }
}

const table = $("table");
const addButton = $("add-button");
const idInput = $("id-input");
const nameInput = $("name-input");
const locationInput = $("location-input");
const amountInput = $("amount-input");
const amountMin = $("amount-min");
const amountMax = $("amount-max");
const tableHead = table.rows[0];

const storage = {};
let freeIds = [];

// HELPER FUNCTIONS

function findAndDeleteMin(arr) {
    let min = Number.MAX_VALUE;
    let minIndex;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < min) {
            min = arr[i];
            minIndex = i;
        }
    }
    arr.splice(minIndex, 1);
    return min;
}

function sortFuncBy(sortBy) {
    if (sortBy === "id") {
        return (a, b) => {
            return Number(a[0]) - Number(b[0]);
        }
    } else if (sortBy === "name") {
        return (a, b) => {
            return a[1].entryName.localeCompare(b[1].entryName);
        }
    } else if (sortBy === "location") {
        return (a, b) => {
            return a[1].location.localeCompare(b[1].location);
        }
    } else {
        return (a, b) => {
            return Number(a[1].amount) - Number(b[1].amount);
        }
    }
}

function filterFunc(element) {
    const [id, entry] = element;
    let min = 0;
    let max = Number.MAX_VALUE;
    if (!amountMin.disabled && amountMin.checkValidity()) {
        min = Number(amountMin.value);
    }
    if (!amountMax.disabled && amountMax.checkValidity()) {
        max = Number(amountMax.value);
    }
    return (idInput.value === "" || idInput.value == id) &&
           (nameInput.value === "" || entry.entryName.includes(nameInput.value)) &&
           (locationInput.value === "" || entry.location.includes(locationInput.value)) &&
           (amountInput.disabled || amountInput.value === "" || entry.amount == amountInput.value) &&
           (entry.amount >= min && entry.amount <= max);
}

function saveStorage() {
    localStorage.clear();
    for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    localStorage.setItem("freeIds", JSON.stringify(freeIds));
}

function loadStorage() {
    for (const key of Object.keys(localStorage)) {
        if (key === "freeIds") {
            freeIds = JSON.parse(localStorage.getItem(key));
            continue;
        }
        storage[key] = JSON.parse(localStorage.getItem(key));
        Object.setPrototypeOf(storage[key], Entry);
    }
}

function addTableRow(entry, id) {
    const row = table.insertRow();
    row.id = id;
    row.innerHTML = `<td class="id">${id}</td><td class="name">${entry.entryName}</td><td class="location">${entry.location}</td><td class="amount">${entry.amount}</td>`;
    const buttonCell = row.insertCell();
    const buttonDiv = document.createElement("div");
    buttonDiv.className = "button-cell";
    const button = document.createElement("input");
    button.type = "button";
    button.value = "Удалить";
    button.id = `delete-${id}`;
    button.className = "delete-button";
    button.onclick = () => {
        if (!button.classList.contains("confirm")) {
            button.classList.add("confirm");
            button.value = "Подтвердить";
            return;
        }
        const deleteId = button.id.split("-")[1];
        if (deleteId !== Object.keys(storage).length + freeIds.length) {
            freeIds.push(deleteId);
        }
        delete storage[deleteId];
        table.deleteRow(row.rowIndex);
        saveStorage();
    }
    button.onblur = () => {
        button.classList.remove("confirm");
        button.value = "Удалить";
    }
    buttonDiv.replaceChildren(button);
    buttonCell.replaceChildren(buttonDiv);
}

function outputStorage(output = Object.entries(storage)) {
    table.replaceChildren(tableHead);
    const column = document.getElementsByClassName("sorted-by")[0];
    output.sort(sortFuncBy(column.id));
    if (column.classList.contains("reversed")) {
        output.reverse();
    }
    for (const [id, entry] of output) {
        addTableRow(entry, id);
    }
}

// HANDLERS

function handleDblclick(evt) {
    const node = evt.target;
    if (node.tagName !== "TD" || node.classList.contains("id")) {
        return;
    }
    const input = document.createElement("input");
    if (node.className === "amount") {
        input.type = "number";
        input.min = "0";
    }
    input.className = "entry-input";
    input.value = node.innerHTML;
    input.onblur = evt => {
        if (input.checkValidity()) {
            storage[node.parentElement.id][node.className === "name" ? "entryName" : node.className] = evt.target.value;
            saveStorage();
        }
        outputStorage();
    }
    node.replaceChildren(input);
    input.focus();
}

function handleTableClick(evt) {
    const node = evt.target;
    if (node.tagName !== "TH" || node.classList.contains("buttons")) {
        return;
    }
    const icon = node.getElementsByTagName("i")[0];
    if (node.classList.contains("sorted-by")) {
        node.classList.toggle("reversed");
        icon.classList.toggle("fa-sort-up");
        icon.classList.toggle("fa-sort-down");
    } else {
        for (const th of document.getElementsByClassName("sorting-by")) {
            th.classList.remove("sorted-by", "reversed");
            const thIcon = th.getElementsByTagName("i")[0];
            thIcon.classList.remove("fa-sort-up", "fa-sort-down");
            thIcon.classList.add("fa-sort");
        }
        node.classList.add("sorted-by");
        icon.classList.remove("fa-sort");
        icon.classList.add("fa-sort-down");
    }
    outputStorage();
}

function handleAddRow() {
    addButton.disabled = true;
    const row = table.insertRow();
    let id, freeIdUsed = false;
    if (freeIds.length !== 0) {
        id = findAndDeleteMin(freeIds);
        freeIdUsed = true;
    } else {
        id = Object.keys(storage).length;
    }

    const idCell = row.insertCell();
    idCell.innerHTML = id;
    idCell.className = "id";

    const nameCell = row.insertCell();
    const nameInput = document.createElement("input");
    nameInput.className = "entry-input";
    nameInput.placeholder = "Наименование";
    nameCell.replaceChildren(nameInput);

    const locationCell = row.insertCell();
    const locationInput = document.createElement("input");
    locationInput.className = "entry-input";
    locationInput.placeholder = "Расположение";
    locationCell.replaceChildren(locationInput);

    const amountCell = row.insertCell();
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.className = "entry-input";
    amountInput.placeholder = "Количество";
    amountInput.min = "0";
    amountCell.replaceChildren(amountInput);

    const buttonCell = row.insertCell();
    const buttonSave = document.createElement("input");
    buttonSave.type = "button";
    buttonSave.value = "Сохранить";
    buttonSave.onclick = () => {
        const entry = new Entry(nameInput.value, locationInput.value, amountInput.checkValidity()? amountInput.value : 0);
        storage[id] = entry;
        table.deleteRow(row.rowIndex);
        addButton.disabled = false;
        saveStorage();
        outputStorage();
    }

    const buttonCancel = document.createElement("button");
    buttonCancel.type = "button";
    buttonCancel.className = "button-cancel fa fa-xmark";
    buttonCancel.onclick = () => {
        table.deleteRow(row.rowIndex);
        if (freeIdUsed) {
            freeIds.push(id);
        }
        addButton.disabled = false;
    }

    buttonCell.replaceChildren(buttonSave, buttonCancel)
}

function handleSearchButton() {
    const searchInputsDiv = $("search-inputs");
    searchInputsDiv.classList.toggle("hidden");
}

function handleCheckAmountRadio(evt) {
    const single = evt.target.id === "amount-single";
    amountInput.disabled = !single;
    amountMax.disabled = single;
    amountMin.disabled = single;
}

function handleSearchApplyButton() {
    if (!amountMin.checkValidity()) {
        amountMin.value = "";
    }
    if (!amountMax.checkValidity()) {
        amountMax.value = "";
    }
    outputStorage(Object.entries(storage).filter(filterFunc));
}

function handleResetButton() {
    idInput.value = "";
    nameInput.value = "";
    locationInput.value = "";
    amountInput.value = "";
    amountMin.value = "";
    amountMax.value = "";
    outputStorage();
}

table.onclick = handleTableClick;
table.ondblclick = handleDblclick;
addButton.onclick = handleAddRow;
$("search-button").onclick = handleSearchButton;
$("amount-single").onchange = handleCheckAmountRadio;
$("amount-range").onchange = handleCheckAmountRadio;
$("button-search-apply").onclick = handleSearchApplyButton;
$("button-search-reset").onclick = handleResetButton;

window.onload = () => {
    if ($("amount-single").checked) {
        amountInput.disabled = false;
    }
    loadStorage();
    outputStorage();
}