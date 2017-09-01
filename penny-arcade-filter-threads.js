// ==UserScript==
// @name         Penny-Arcade Filter Thread
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Filters any thread out that you wish.
// @author       urahonky
// @match        https://forums.penny-arcade.com/*
// @grant        none
// ==/UserScript==

// Examples:
// const ignoreThreadTitlesContaining = ["Overwatch"];
// const ignoreThreadTitlesContaining = ["Overwatch", "FFRK", "Forza"];
const ignoreThreadTitlesContaining = [];

(function() {
    'use strict';

    let threads = Array.from(document.getElementsByClassName("Title"));

    ignoreThreadTitlesContaining.forEach(function(ignoreTitle){
        threads.forEach(function(thread){
            if(thread.innerHTML.includes(ignoreTitle)){
                thread.parentNode.parentNode.parentNode.style.display = "none";
            }
        });
    });
})();