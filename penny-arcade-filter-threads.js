// ==UserScript==
// @name         Penny-Arcade Filter Threads
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Filters any thread out that you wish.
// @author       urahonky
// @match        https://forums.penny-arcade.com/*
// @grant        none
// ==/UserScript==

let pathName = window.location.pathname; // usually: /categories/<subforum-name>
let username = document.getElementsByClassName("Username")[0].innerText; // Avoiding using jQuery here, even though I end up using AJAX later...
let threads = Array.from(document.getElementsByClassName("Title")); // Threads on the page
let ignoredThreads = localStorage.getItem('hideThreads') ? JSON.parse(localStorage.getItem('hideThreads')) : []; // Grabs thread IDs that have already been clicked, or empty list if none.

const buttonStyle = "float:right; border:none; background:transparent; color:red; font-size:18px; padding-right:15px";
const deleteButtonStyle = "border:none; background:transparent; color:red; font-size:18px; padding-right:15px";

/*
    ACTIONS:
*/

const addNewFilter = function(threadId, title){
    let filterTable = document.getElementById("filterTable");
    let row = filterTable.insertRow();
    let cell = row.insertCell();
    cell.innerText = threadId;
    cell = row.insertCell();
    cell.innerText = title;
    let deleteButton = document.createElement('button');
    deleteButton.innerHTML = "X";
    deleteButton.setAttribute("style", deleteButtonStyle);
    deleteButton.addEventListener("click", removeFilter);
    cell = row.insertCell();
    cell.style.textAlign = "center";
    cell.appendChild(deleteButton);
};

const removeFilter = function(evt){
    let rowNode = evt.target.parentNode.parentNode;
    let removeThreadId = rowNode.cells[0].innerText;
    document.getElementById("filterTable").deleteRow(rowNode.rowIndex);
    // Look for threadId in the hideThreads localStorage
    let hiddenThreads = JSON.parse(localStorage.getItem('hideThreads'));
    let removeIndex = 0;
    hiddenThreads.some(function(thread, count){
        if(thread.id === removeThreadId){
            removeIndex = count;
            return true;
        }
    });
    hiddenThreads.splice(removeIndex, 1);
    localStorage.setItem('hideThreads', JSON.stringify(hiddenThreads));
    // Now display the thread if it is in the table
    let foundThread = threads.find((thread) => {
        let threadId = thread.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        return threadId == removeThreadId;
    });
    if(foundThread != undefined){
        let tableRow = foundThread.parentNode.parentNode.parentNode;
        tableRow.style.display = "table-row";
        let threadDiv = foundThread.parentNode.parentNode;
        if(threadDiv.children.length == 1){
            // This means the button doesn't exist yet and we need to place it
            let button = document.createElement("button");
            button.innerHTML = "X";
            button.setAttribute("style", buttonStyle);
            threadDiv.style.paddingTop = "10px";
            // Grab the div Wrap
            let divWrap = threadDiv.getElementsByClassName("Wrap")[0];
            divWrap.style.display = "inline-block";
            threadDiv.appendChild(button);

            button.addEventListener("click", addFilter.bind(this, removeThreadId, foundThread));
        }
    }
    updateFilteredThreads(); // Update AWS
};

const addFilter = function(threadId, thread){
    thread.parentNode.parentNode.parentNode.style.display = "none";
    let hiddenThreadStorage = localStorage.getItem('hideThreads');
    let hideThisThread = {
        'id': threadId,
        'path': pathName,
        'title': thread.innerText
    };
    if(hiddenThreadStorage){
        let hiddenThreads = JSON.parse(hiddenThreadStorage);
        if(hiddenThreads.indexOf(threadId) === -1){
            hiddenThreads.push(hideThisThread);
            localStorage.setItem('hideThreads', JSON.stringify(hiddenThreads));
        }
    } else {
        localStorage.setItem('hideThreads', JSON.stringify([hideThisThread]));
    }
    updateFilteredThreads();
    addNewFilter(threadId, thread.innerText);
};

const displayOrHideFilters = function(){
    let table = document.getElementById("filterTable");
    let expandButton = document.getElementById("expandButton");
    if(table.style.display === "table"){
        table.style.display = "none";
        expandButton.innerText = "DISPLAY FILTERS";
    } else {
        table.style.display = "table";
        expandButton.innerText = "HIDE FILTERS";
    }
};

/*
    DISPLAY:
*/

const addFilterToThreads = function(){
    // Add X to each thread so you can remove them without having to add the titles manually
    threads.forEach(function(thread){
        let threadId = thread.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        let ignore = ignoredThreads.some(function(ignored){
            // Check if the thread is already ignored, no need to put the X on a hidden thread
            if(ignored.id === threadId){
                thread.parentNode.parentNode.parentNode.style.display = "none";
                return true;
            }
        });
        if(!ignore){
            let button = document.createElement("button");
            button.innerHTML = "X";
            button.setAttribute("style", buttonStyle);

            // Grab div containing the thread title
            let threadDiv = thread.parentNode.parentNode;
            threadDiv.style.paddingTop = "10px";
            // Grab the div Wrap
            let divWrap = threadDiv.getElementsByClassName("Wrap")[0];
            divWrap.style.display = "inline-block";

            // Prevent double X's
            if(threadDiv.childElementCount === 1){
                threadDiv.appendChild(button);
                button.addEventListener("click", addFilter.bind(this, threadId, thread));
            }
        }
    });
};


const addButtonsAndTableToPage = function(){
    // Adds the buttons and table at the bottom of the page. Leaves the data up to the other function.
    let footCrumbs = document.getElementById("FootCrumbs");
    let expandDiv = document.createElement("div");
    let expandButton = document.createElement("button");
    expandButton.setAttribute('id', 'expandButton');
    expandButton.style.cursor = "pointer";
    expandButton.style.background = "#fefefe";
    expandButton.style.border = "2px solid black";
    expandButton.style.padding = "10px";
    expandButton.style.marginLeft = "20px";
    expandButton.style.width = "150px";
    expandButton.innerHTML = "DISPLAY FILTERS";
    expandButton.addEventListener("click", displayOrHideFilters);
    expandDiv.appendChild(expandButton);

    let mergeButton = document.createElement("button");
    mergeButton.setAttribute('id', 'mergeButton');
    mergeButton.style.cursor = "pointer";
    mergeButton.style.background = "#fefefe";
    mergeButton.style.border = "2px solid black";
    mergeButton.style.padding = "10px";
    mergeButton.style.marginLeft = "20px";
    mergeButton.style.width = "150px";
    mergeButton.innerHTML = "MERGE FILTERS";
    mergeButton.addEventListener("click", mergeFilters);
    expandDiv.appendChild(mergeButton);
    footCrumbs.appendChild(expandDiv);

    let table = document.createElement("TABLE");
    table.setAttribute('id', 'filterTable');
    table.style.display = "none";
    table.style.marginTop = "10px";
    table.style.marginLeft = "20px";
    table.style.background = "white";
    table.style.border = "1px solid black";
    table.style.borderSpacing = "10px";
    table.style.width = "1200px";

    footCrumbs.appendChild(table);
    let header = table.createTHead();
    let row = header.insertRow(0);
    let cell = row.insertCell();
    cell.style.width = "120px";
    cell.innerHTML = "<b>Thread ID</b>";
    cell = row.insertCell();
    cell.style.width = "870px";
    cell.innerHTML = "<b>Title</b>";
    cell = row.insertCell();
    cell.style.textAlign = "center";
    cell.innerHTML = "<b>Remove Filter</b>";
};

const buildFilterTable = function(){
    let table = document.getElementById("filterTable");
    let tbody = table.getElementsByTagName('tbody')[0] === undefined ? table.createTBody() : table.getElementsByTagName('tbody')[0];
    // Rebuild the tbody
    Array.from(tbody.children).forEach((child) => { tbody.removeChild(child); });
    ignoredThreads.filter(thread => thread.path === pathName).forEach(function(ignoredThread, count){ // Display ONLY the ones that are filtered on the current page.
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = "X";
        deleteButton.setAttribute("style", deleteButtonStyle);
        deleteButton.addEventListener("click", removeFilter);
        let row = tbody.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = ignoredThread.id;
        cell = row.insertCell();
        cell.innerHTML = "<a style='color:black !important;text-decoration:underline' href='https://forums.penny-arcade.com/discussion/" + ignoredThread.id + "/#latest'>" + ignoredThread.title + "</a>";
        cell = row.insertCell();
        cell.style.textAlign = "center";
        cell.appendChild(deleteButton);
    });
};

/*
    Utility Functions:
*/

const mergeFilters = function(){
    getFilteredThreads().then((res) => {
        let aws_session = JSON.parse(res.Item.session.S);
        let local_session = JSON.parse(localStorage.getItem('hideThreads')) == null? [] : JSON.parse(localStorage.getItem('hideThreads'));
        let combined_ids = aws_session.map((ses) => { return ses.id }).concat(local_session.map((ses) => {return ses.id}));
        let unique_ids = Array.from(new Set(combined_ids)); // Basically converts the list to a set and back to a list. Removes any duplicate IDs.

        if(!(aws_session.length === unique_ids.length && local_session.length === unique_ids.length)){ // absolutely sure that they are different at this point
            if(confirm("Are you sure you want to merge the following sessions?\n\nLocal: "+ localStorage.getItem('hideThreads') + "\n\nSaved: " + res.Item.session.S)){
                // Merge the two.
                let mergedFilteredList = [];
                unique_ids.forEach((id) => {
                    let thread = aws_session.find((at) => { return at.id === id });
                    if(!thread){
                        thread = local_session.find((lt) => { return lt.id === id});
                    }
                    mergedFilteredList.push(thread);
                });
                localStorage.setItem('hideThreads', JSON.stringify(mergedFilteredList));
                ignoredThreads = mergedFilteredList;
                addFilterToThreads();
                buildFilterTable();
            }
        }
    });
};

const getFilteredThreads = function(){
    let settings = {
        crossDomain: true,
        url: "https://hta33a0i4a.execute-api.us-east-2.amazonaws.com/default/PAStoreSession",
        method: "GET",
        data: {
            username: username
        }
    };
    return $.ajax(settings);
};

const updateFilteredThreads = function(){
    let settings = {
        crossDomain: true,
        url: "https://hta33a0i4a.execute-api.us-east-2.amazonaws.com/default/PAStoreSession",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            username: username,
            session: JSON.parse(localStorage.getItem('hideThreads'))
        }),
        dataType: "json"
    };
    return $.ajax(settings).done(() => { });
};

(function() {
    'use strict';
    if(pathName.indexOf('categories') !== -1){
        // Up-to-Date Version
        //getPathName();
        addButtonsAndTableToPage();
        // Apply filters
        let lastUpdated = sessionStorage.getItem('lastUpdated');

        if(lastUpdated === null || new Date() - new Date(lastUpdated) >= 86400000){
            // Set timestamp and get threads in AWS
            sessionStorage.setItem('lastUpdated', new Date());
            getFilteredThreads().then(function(res){
                ignoredThreads = res.Item ? JSON.parse(res.Item.session.S) : [];
                localStorage.setItem('hideThreads', JSON.stringify(ignoredThreads));// Overwrites threads, be cautious!
                addFilterToThreads();
                buildFilterTable();
            });
        } else {
            // Pulled from AWS in the past 24 hours
            addFilterToThreads();
            buildFilterTable();
        }
    }
})();