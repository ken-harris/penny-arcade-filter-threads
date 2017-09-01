// ==UserScript==
// @name         Penny-Arcade Filter Threads
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Filters any thread out that you wish.
// @author       urahonky
// @match        https://forums.penny-arcade.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let threads = Array.from(document.getElementsByClassName("Title")); // Threads on the page
    let ignoredThreads = localStorage.getItem('hideThreads') ? JSON.parse(localStorage.getItem('hideThreads')) : []; // Grabs thread IDs that have already been clicked, or empty list if none.
    
    let clickFunction = function(text, thread){
        let hiddenThreadStorage = localStorage.getItem('hideThreads');
        if(hiddenThreadStorage){
            let hiddenThreads = JSON.parse(hiddenThreadStorage);
            if(hiddenThreads.indexOf(text) === -1){
                hiddenThreads.push(text);
                localStorage.setItem('hideThreads', JSON.stringify(hiddenThreads));
            }
        } else {
            localStorage.setItem('hideThreads', JSON.stringify([text]));
        }
        thread.parentNode.parentNode.parentNode.style.display = "none";
    };
    
    let buttonStyle = "float:left; border:none; background:transparent; color:red; font-size:18px; padding-right:15px";

    // Add X to each thread so you can remove them without having to add the titles manually
    threads.forEach(function(thread){
        let threadId = thread.getAttribute("href").replace("https://forums.penny-arcade.com/discussion/","").split("/")[0];
        if(ignoredThreads.indexOf(threadId) !== -1){
            // This is an ignored thread
            thread.parentNode.parentNode.parentNode.style.display = "none";
        } else {
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
            threadDiv.insertBefore(divWrap, button);

            button.addEventListener("click", clickFunction.bind(this, threadId, thread));            
        }
    });
})();