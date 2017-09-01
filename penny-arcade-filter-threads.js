// ==UserScript==
// @name         Penny-Arcade Filter Threads
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Filters any thread out that you wish.
// @author       urahonky
// @match        https://forums.penny-arcade.com/*
// @grant        none
// ==/UserScript==

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
    threads.some(function(thread){
        let threadId = thread.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        if(threadId === removeThreadId){
            let tableRow = thread.parentNode.parentNode.parentNode;
            tableRow.style.display = "table-row";
            let threadDiv = thread.parentNode.parentNode;
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

                button.addEventListener("click", addFilter.bind(this, threadId, thread));
            }
            return true;
        }
    });
};

const addFilter = function(threadId, thread){
    thread.parentNode.parentNode.parentNode.style.display = "none";
        let hiddenThreadStorage = localStorage.getItem('hideThreads');
        let hideThisThread = {
            'id': threadId,
            'title': thread.innerHTML
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
            threadDiv.appendChild(button);

            button.addEventListener("click", addFilter.bind(this, threadId, thread));
        }
    });
};

const buildFilterTable = function(){
    // Create table at the bottom that allows you to manage the filters
    let footCrumbs = document.getElementById("FootCrumbs");
    let expandDiv = document.createElement("div");
    let expandButton = document.createElement("button");
    expandButton.setAttribute('id', 'expandButton');
    expandButton.style.background = "#fefefe";
    expandButton.style.border = "2px solid black";
    expandButton.style.padding = "10px";
    expandButton.style.marginLeft = "20px";
    expandButton.style.width = "150px";
    expandButton.innerHTML = "DISPLAY FILTERS";
    expandButton.addEventListener("click", displayOrHideFilters);
    expandDiv.appendChild(expandButton);
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

    ignoredThreads.forEach(function(ignoredThread, count){
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = "X";
        deleteButton.setAttribute("style", deleteButtonStyle);
        deleteButton.addEventListener("click", removeFilter);
        row = table.insertRow();
        cell = row.insertCell();
        cell.innerHTML = ignoredThread.id;
        cell = row.insertCell();
        cell.innerHTML = "<a style='color:black !important;text-decoration:underline' href='https://forums.penny-arcade.com/discussion/" + ignoredThread.id + "/#latest'>" + ignoredThread.title + "</a>";
        cell = row.insertCell();
        cell.style.textAlign = "center";
        cell.appendChild(deleteButton);
    });
};

(function() {
    'use strict';
    addFilterToThreads();
    buildFilterTable();
})();