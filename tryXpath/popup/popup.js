/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    const noneClass = "none";

    var mainWay, mainExpression, contextCheckbox, contextHeader, contextBody,
        contextWay, contextExpression, resolverHeader, resolverBody,
        resolverCheckbox, resolverExpression, frameHeader, frameCheckbox,
        frameBody, frameExpression, resultsMessage, resultsTbody,
        contextTbody, resultsCount;

    var relatedTabId, executionId;

    function sendToActiveTab(msg) {
        chrome.tabs.query({ "active": true, "currentWindow": true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, msg);
        });
    };

    function collectPopupState() {
        var state = Object.create(null);
        state.mainWayIndex = mainWay.selectedIndex;
        state.mainExpressionValue = mainExpression.value;
        state.contextCheckboxChecked = contextCheckbox.checked;
        state.contextWayIndex = contextWay.selectedIndex;
        state.contextExpressionValue = contextExpression.value;
        state.resolverCheckboxChecked = resolverCheckbox.checked;
        state.resolverExpressionValue = resolverExpression.value;
        state.frameCheckboxChecked = frameCheckbox.checked;
        state.frameExpressionValue = frameExpression.value;
        return state;
    };

    function changeContextVisible () {
        if (contextCheckbox.checked) {
            contextBody.classList.remove(noneClass);
        } else {
            contextBody.classList.add(noneClass);
        }
    };

    function changeResolverVisible () {
        if (resolverCheckbox.checked) {
            resolverBody.classList.remove(noneClass);
        } else {
            resolverBody.classList.add(noneClass);
        }
    };

    function changeFrameVisible () {
        if (frameCheckbox.checked) {
            frameBody.classList.remove(noneClass);
        } else {
            frameBody.classList.add(noneClass);
        }
    };

    function makeExecuteMessage() {
        var msg = Object.create(null);
        msg.event = "execute";

        var resol;
        if (resolverCheckbox.checked) {
            resol = resolverExpression.value;
        } else {
            resol = null;
        }

        var way = mainWay.selectedOptions[0];
        msg.main = Object.create(null);
        msg.main.expression = mainExpression.value;
        msg.main.method = way.getAttribute("data-method");
        msg.main.resultType = way.getAttribute("data-type");
        msg.main.resolver = resol;

        if (contextCheckbox.checked) {
            let way = contextWay.selectedOptions[0];
            msg.context = Object.create(null);
            msg.context.expression = contextExpression.value;
            msg.context.method = way.getAttribute("data-method");
            msg.context.resultType = way.getAttribute("data-type");
            msg.context.resolver = resol;
        }

        if (frameCheckbox.checked) {
            msg.frameDesignation = frameExpression.value;
        }

        return msg;
    };

    function sendExecute() {
        sendToActiveTab(makeExecuteMessage());        
    };

    function handleExprEnter (event) {
        if ((event.key === "Enter") && !event.shiftKey) {
            event.preventDefault();
            sendExecute();
        }
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);;
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.showResultsInPopup = function (message, sender){
        relatedTabId = sender.tab.id;
        executionId = message.executionId;

        resultsMessage.textContent = message.message;
        resultsCount.textContent = message.main.itemDetails.length;

        fu.emptyChildNodes(contextTbody);
        contextTbody.appendChild(fu.createDetailTableHeader());
        if (message.context) {
            fu.appendDetailRows(contextTbody, [message.context.itemDetail]);
        }

        fu.emptyChildNodes(resultsTbody);
        resultsTbody.appendChild(fu.createDetailTableHeader());
        fu.appendDetailRows(resultsTbody,
                            message.main.itemDetails.slice(0, 10));
    };

    genericListener.listeners.restorePopupState = function (message) {
        var state = message.state;

        if (state !== null) {
            mainWay.selectedIndex = state.mainWayIndex;
            mainExpression.value = state.mainExpressionValue;
            contextCheckbox.checked = state.contextCheckboxChecked;
            contextWay.selectedIndex = state.contextWayIndex;
            contextExpression.value = state.contextExpressionValue;
            resolverCheckbox.checked = state.resolverCheckboxChecked;
            resolverExpression.value = state.resolverExpressionValue;
            frameCheckbox.checked = state.frameCheckboxChecked;
            frameExpression.value = state.frameExpressionValue;
        }

        changeContextVisible();
        changeResolverVisible();
        changeFrameVisible();
    };

    window.addEventListener("load", () => {
        mainWay = document.getElementById("main-way");
        mainExpression = document.getElementById("main-expression");
        contextHeader = document.getElementById("context-header");
        contextCheckbox = document.getElementById("context-switch");
        contextBody = document.getElementById("context-body");
        contextWay = document.getElementById("context-way");
        contextExpression = document.getElementById("context-expression");
        resolverHeader = document.getElementById("resolver-header");
        resolverCheckbox = document.getElementById("resolver-switch");
        resolverBody = document.getElementById("resolver-body");
        resolverExpression = document.getElementById("resolver-expression");
        frameHeader = document.getElementById("frame-header");
        frameCheckbox = document.getElementById("frame-switch");
        frameBody = document.getElementById("frame-body");
        frameExpression = document.getElementById("frame-expression");
        resultsMessage = document.getElementById("results-message");
        resultsCount = document.getElementById("results-count");
        resultsTbody = document.getElementById("results-detals")
            .getElementsByTagName("tbody")[0];
        contextTbody = document.getElementById("context-detail")
            .getElementsByTagName("tbody")[0];

        document.getElementById("execute").addEventListener("click",
                                                            sendExecute);

        mainExpression.addEventListener("keypress", handleExprEnter);

        contextHeader.addEventListener("click", changeContextVisible);
        contextHeader.addEventListener("keypress", changeContextVisible);
        contextExpression.addEventListener("keypress", handleExprEnter);

        resolverHeader.addEventListener("click", changeResolverVisible);
        resolverHeader.addEventListener("keypress", changeResolverVisible);
        resolverExpression.addEventListener("keypress", handleExprEnter);

        frameHeader.addEventListener("click", changeFrameVisible);
        frameHeader.addEventListener("keypress", changeFrameVisible);
        frameExpression.addEventListener("keypress", handleExprEnter);

        document.getElementById("show-all-results").addEventListener(
            "click", () => {
                sendToActiveTab({ "event": "requestShowAllResults" });
            });

        document.getElementById("open-options").addEventListener(
            "click", () => {
                chrome.runtime.openOptionsPage();
            });

        document.getElementById("set-style").addEventListener("click", () => {
            sendToActiveTab({ "event": "setStyle" });
        });

        document.getElementById("reset-style").addEventListener("click",()=> {
            sendToActiveTab({ "event": "resetStyle" });
        });

        contextTbody.addEventListener("click", event => {
            if (event.target.tagName.toLowerCase() === "button") {
                chrome.tabs.sendMessage(relatedTabId, {
                    "event": "focusContextItem",
                    "executionId": executionId,
                });
            }
        });

        resultsTbody.addEventListener("click", event => {
            var target = event.target;
            if (target.tagName.toLowerCase() === "button") {
                let ind = parseInt(target.getAttribute("data-index"), 10);
                chrome.tabs.sendMessage(relatedTabId, {
                    "event": "focusItem",
                    "executionId": executionId,
                    "index": ind
                });
            }
        });

        window.addEventListener("unload", () => {
            var state = collectPopupState();
            chrome.runtime.sendMessage({
                "event": "storePopupState",
                "state": state
            });
        });

        resultsTbody.appendChild(fu.createDetailTableHeader());
        contextTbody.appendChild(fu.createDetailTableHeader());

        sendToActiveTab({ "event": "requestShowResultsInPopup" });
        chrome.runtime.sendMessage({ "event": "requestRestorePopupState" });
    });


})(window);
