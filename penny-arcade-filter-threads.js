// ==UserScript==
// @name         Penny-Arcade Filter Threads
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Filters any thread out that you wish. Now supports cross-browser synchronization!
// @author       urahonky
// @match        https://forums.penny-arcade.com/*
// @grant        none
// ==/UserScript==

let pathName = window.location.pathname; // usually: /categories/<subforum-name>
let username = document.getElementsByClassName("Username")[0].innerText; // Avoiding using jQuery here, even though I end up using AJAX later...
let threads = Array.from(document.getElementsByClassName("Title")); // Threads on the page
let ignoredThreads = localStorage.getItem('hideThreads') ? JSON.parse(localStorage.getItem('hideThreads')) : []; // Grabs thread IDs that have already been clicked, or empty list if none.
let ignoredThreadTitles = localStorage.getItem("ignoreTitles") ? JSON.parse(localStorage.getItem('ignoreTitles')) : []; // Grabs the user-defined thread title filters

const buttonStyle = "float:right; border:none; background:transparent; color:red; font-size:18px; padding-right:15px";
const deleteButtonStyle = "border:none; background:transparent; color:red; font-size:18px; padding-right:15px; cursor:pointer";

/*
    ACTIONS:
*/

const addNewFilter = function(threadId, title){
    let threadTable = document.getElementById("threadTable");
    let row = threadTable.insertRow();
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

const addNewTextFilter = function(text){
    let titleTable = document.getElementById("titleTable");
    let row = titleTable.insertRow();
    let cell = row.insertCell();
    cell.innerText = text;
    let deleteButton = document.createElement('button');
    deleteButton.innerHTML = "X";
    deleteButton.setAttribute("style", deleteButtonStyle);
    deleteButton.addEventListener("click", removeTextFilter);
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
    let threadTable = document.getElementById("threadTable");
    let titleTable = document.getElementById("titleTable");
    let expandButton = document.getElementById("expandButton");
    if(threadTable.style.display === "table"){
        threadTable.style.display = "none";
        titleTable.style.display = "none";
        expandButton.innerText = "DISPLAY FILTERS";
    } else {
        threadTable.style.display = "table";
        titleTable.style.display = "table";
        expandButton.innerText = "HIDE FILTERS";
    }
};

const addTextFilter = function(text){
    if(ignoredThreadTitles.indexOf(text) === -1){
        ignoredThreadTitles.push(text);
        localStorage.setItem('ignoreTitles', JSON.stringify(ignoredThreadTitles));
    }
    addNewTextFilter(text);
    addFilterToThreads();
    updateFilteredThreads();
};

const removeTextFilter = function(evt){
    let rowNode = evt.target.parentNode.parentNode;
    let removeTextTitle = rowNode.cells[0].innerText;
    // Remove the row from the table
    document.getElementById("titleTable").deleteRow(rowNode.rowIndex);

    let titleIndex = ignoredThreadTitles.indexOf(removeTextTitle);
    if(titleIndex !== -1){
        ignoredThreadTitles.splice(titleIndex, 1);
        localStorage.setItem("ignoreTitles", JSON.stringify(ignoredThreadTitles));
    }

    // Add the threads back on the page if they exist (can have more than one)
    let foundThreads = threads.filter((thread) => {
        let threadTitle = thread.innerText.toLowerCase();
        return threadTitle.indexOf(removeTextTitle.toLowerCase()) !== -1;
    });

    foundThreads.forEach((ft) => {
        let threadId = ft.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        let tableRow = ft.parentNode.parentNode.parentNode;
        tableRow.style.display = "table-row";
        let threadDiv = ft.parentNode.parentNode;
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

            button.addEventListener("click", addFilter.bind(this, threadId, ft));
        }
    });
    updateFilteredThreads(); // update AWS
};

const checkForEnter = function(e){
    // Used for the Title Input
    if(e.key === 'Enter'){
        addTextFilter(e.target.value);
        e.target.value = "";
    }
}

/*
    DISPLAY:
*/

const addTextFilterToPage = function(){
    let filterDiv = document.getElementById("filterDiv");
    let filterInput = document.createElement("input");
    filterInput.setAttribute('id', 'filterInput');
    filterInput.placeholder = "Enter text filter here...";
    filterInput.style.border = "2px solid black";
    filterInput.style.padding = "10px";
    filterInput.style.marginLeft = "20px";
    filterInput.style.width = "150px";
    filterInput.addEventListener("keyup", checkForEnter);
    filterDiv.appendChild(filterInput);

    let questionImg = document.createElement("img");
    questionImg.setAttribute("src", "data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJxdWVzdGlvbi1jaXJjbGUiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1xdWVzdGlvbi1jaXJjbGUgZmEtdy0xNiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik01MDQgMjU2YzAgMTM2Ljk5Ny0xMTEuMDQzIDI0OC0yNDggMjQ4UzggMzkyLjk5NyA4IDI1NkM4IDExOS4wODMgMTE5LjA0MyA4IDI1NiA4czI0OCAxMTEuMDgzIDI0OCAyNDh6TTI2Mi42NTUgOTBjLTU0LjQ5NyAwLTg5LjI1NSAyMi45NTctMTE2LjU0OSA2My43NTgtMy41MzYgNS4yODYtMi4zNTMgMTIuNDE1IDIuNzE1IDE2LjI1OGwzNC42OTkgMjYuMzFjNS4yMDUgMy45NDcgMTIuNjIxIDMuMDA4IDE2LjY2NS0yLjEyMiAxNy44NjQtMjIuNjU4IDMwLjExMy0zNS43OTcgNTcuMzAzLTM1Ljc5NyAyMC40MjkgMCA0NS42OTggMTMuMTQ4IDQ1LjY5OCAzMi45NTggMCAxNC45NzYtMTIuMzYzIDIyLjY2Ny0zMi41MzQgMzMuOTc2QzI0Ny4xMjggMjM4LjUyOCAyMTYgMjU0Ljk0MSAyMTYgMjk2djRjMCA2LjYyNyA1LjM3MyAxMiAxMiAxMmg1NmM2LjYyNyAwIDEyLTUuMzczIDEyLTEydi0xLjMzM2MwLTI4LjQ2MiA4My4xODYtMjkuNjQ3IDgzLjE4Ni0xMDYuNjY3IDAtNTguMDAyLTYwLjE2NS0xMDItMTE2LjUzMS0xMDJ6TTI1NiAzMzhjLTI1LjM2NSAwLTQ2IDIwLjYzNS00NiA0NiAwIDI1LjM2NCAyMC42MzUgNDYgNDYgNDZzNDYtMjAuNjM2IDQ2LTQ2YzAtMjUuMzY1LTIwLjYzNS00Ni00Ni00NnoiPjwvcGF0aD48L3N2Zz4=");
    questionImg.style.height = "20px";
    questionImg.style.top = "5px";
    questionImg.style.position = "relative";
    questionImg.style.cursor = "help";
    questionImg.title = "This feature allows you to filter based on text you wish to ignore. This is especially helpful if you want to hide repeat threads.";
    filterDiv.appendChild(questionImg);
};

const addFilterToThreads = function(){
    // Add X to each thread so you can remove them without having to add the titles manually
    threads.forEach(function(thread){
        let threadId = thread.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        let ignore = ignoredThreads.some((ignored) => {
            // Check if the thread is already ignored, no need to put the X on a hidden thread
            if(ignored.id === threadId){
                thread.parentNode.parentNode.parentNode.style.display = "none";
                return true;
            }
        });
        if(!ignore) {
            // Need to check if the title contains any of the text filters.
            ignore = ignoredThreadTitles.some((ignoredTitle) => {
                let threadTitle = thread.innerText.toLowerCase();
                if(threadTitle.indexOf(ignoredTitle.toLowerCase()) !== -1){
                    thread.parentNode.parentNode.parentNode.style.display = "none";
                    return true;
                }
            })
        }
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
    let filterDiv = document.createElement("div");
    filterDiv.setAttribute('id', 'filterDiv');
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
    filterDiv.appendChild(expandButton);

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
    filterDiv.appendChild(mergeButton);
    footCrumbs.appendChild(filterDiv);

    let threadTableDiv = document.createElement("div");
    threadTableDiv.setAttribute("id", "threadTableDiv");

    let threadTable = document.createElement("table");
    threadTable.setAttribute('id', 'threadTable');
    threadTable.style.display = "none";
    threadTable.style.marginTop = "10px";
    threadTable.style.marginLeft = "20px";
    threadTable.style.background = "white";
    threadTable.style.border = "1px solid black";
    threadTable.style.borderSpacing = "10px";
    threadTable.style.width = "1200px";
    threadTableDiv.appendChild(threadTable);
    footCrumbs.appendChild(threadTableDiv);
    let header = threadTable.createTHead();
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

    let titleTable = document.createElement('table');
    titleTable.setAttribute('id', 'titleTable');
    titleTable.style.display = "none";
    titleTable.style.marginTop = "10px";
    titleTable.style.marginLeft = "20px";
    titleTable.style.background = "white";
    titleTable.style.border = "1px solid black";
    titleTable.style.borderSpacing = "10px";
    titleTable.style.width = "1200px";
    threadTableDiv.appendChild(titleTable);

    header = titleTable.createTHead();
    row = header.insertRow(0);
    cell = row.insertCell();
    cell.style.width = "120px";
    cell.innerHTML = "<b>Title</b>";
    cell = row.insertCell();
    cell.style.textAlign = "center";
    cell.innerHTML = "<b>Remove Filter</b>";
};

const buildFilterTable = function(){
    let threadTable = document.getElementById("threadTable");
    let tbody = threadTable.getElementsByTagName('tbody')[0] === undefined ? threadTable.createTBody() : threadTable.getElementsByTagName('tbody')[0];
    // Rebuild the tbody
    Array.from(tbody.children).forEach((child) => { tbody.removeChild(child); });
    ignoredThreads.filter(thread => thread.path === pathName).forEach(function(ignoredThread, count){ // Display ONLY the ones that are filtered on the current page.
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = "X";
        deleteButton.style.cursor = "pointer";
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

const buildTitleTable = function(){
    let titleTable = document.getElementById("titleTable");
    let tbody = titleTable.getElementsByTagName('tbody')[0] === undefined ? titleTable.createTBody() : titleTable.getElementsByTagName('tbody')[0];
    // Rebuild the tbody
    Array.from(tbody.children).forEach((child) => { tbody.removeChild(child); });
    ignoredThreadTitles.forEach(function(ignoredTitle, count){ // Display ONLY the ones that are filtered on the current page.
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = "X";
        deleteButton.setAttribute("style", deleteButtonStyle);
        deleteButton.addEventListener("click", removeTextFilter);
        let row = tbody.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = ignoredTitle;
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
        let aws_session = res.Item ? JSON.parse(res.Item.session.S) : [];
        let local_session = JSON.parse(localStorage.getItem('hideThreads')) == null? [] : JSON.parse(localStorage.getItem('hideThreads'));
        let combined_ids = aws_session.map((ses) => { return ses.id }).concat(local_session.map((ses) => {return ses.id}));
        let unique_ids = Array.from(new Set(combined_ids)); // Basically converts the list to a set and back to a list. Removes any duplicate IDs.

        if(!(aws_session.length === unique_ids.length && local_session.length === unique_ids.length)){ // absolutely sure that they are different at this point
            if(confirm("Are you sure you want to merge the following sessions?\n\nLocal: "+ localStorage.getItem('hideThreads') + "\n\nSaved: " + JSON.stringify(aws_session))){
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
                updateFilteredThreads();
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
            username: username,
            version: '2'
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
            version: '2',
            username: username,
            session: JSON.parse(localStorage.getItem('hideThreads')),
            textFilters: JSON.parse(localStorage.getItem('ignoreTitles'))
        }),
        dataType: "json"
    };
    return $.ajax(settings).done(() => { });
};

(function() {
    'use strict';

    if(pathName.indexOf('categories') !== -1){
        // Check if previous version, if so then clear the old threads.

        if(ignoredThreads && ignoredThreads.length > 0 && ignoredThreads[0].path == undefined){
            alert("You were using an old version of the PA Filter Threads tool. This new version now tracks your thread filters based on the subforum. This means that the tool will need to purge your threads and you will need to start over!");
            localStorage.setItem('hideThreads', "[]");
            ignoredThreads = [];
        }
        addButtonsAndTableToPage();
        addTextFilterToPage();

        let lastUpdated = sessionStorage.getItem('lastUpdated');

        if(lastUpdated === null || new Date() - new Date(lastUpdated) >= 86400000){
            // Set timestamp and get threads in AWS
            sessionStorage.setItem('lastUpdated', new Date());
            getFilteredThreads().then(function(res){
                ignoredThreads = res.Item ? JSON.parse(res.Item.session.S) : [];
                ignoredThreadTitles = res.Item ? JSON.parse(res.Item.textFilters.S) : [];
                localStorage.setItem('hideThreads', JSON.stringify(ignoredThreads));// Overwrites threads, be cautious!
                localStorage.setItem('ignoreTitles', JSON.stringify(ignoredThreadTitles));
                addFilterToThreads();
                buildFilterTable();
                buildTitleTable();
            });
        } else {
            // Pulled from AWS in the past 24 hours
            addFilterToThreads();
            buildFilterTable();
            buildTitleTable();
        }
    } else {
        // Remove the Draft Button from the page
        document.getElementsByClassName("Buttons")[0].removeChild(document.getElementsByClassName("DraftButton")[0])
    }
})();