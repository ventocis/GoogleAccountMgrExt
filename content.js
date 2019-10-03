//TODO: See if there's a better way than using global vars

var emails = [];
var contextIds = [];
var nicknames = [];
var fake = [];

/** Get the nicknames from the cloud storage */
chrome.storage.sync.get("oNicknames", function (result) {
    // if (result.oNicknames !== undefined)
        nicknames = result.oNicknames;

    alert("nicknames: " + nicknames);
});


/** Get the context ID's from the cloud storage */
chrome.storage.sync.get("oContextIds", function (result) {
    // if (result.oContextIds !== undefined)
        contextIds = result.oContextIds;
    alert("contextIds: " + contextIds);
});

/** Gets the emails from the cloud storage */
chrome.storage.sync.get("onlineEmails", function (result) {
    // if (result.onlineEmails !== undefined)
    emails = result.onlineEmails;
    alert("emails: " + result.onlineEmails);
    
    initializeMenus();
});


/** Liste */
chrome.storage.onChanged.addListener(function (changes, namespace) {
    var anythingChange = false;
    for (var key in changes) {
        var storageChange = changes[key];
        if (key == "oContextIds") {
            if (String(storageChange.newValue) != String(contextIds)) {
                alert("old context IDS: " + contextIds + "new: " + storageChange.newValue);
                anythingChange = true;
                contextIds = storageChange.newValue
                alert('context Ids updated to ' + contextIds);
            }
        }

        else if (key === "oNicknames") {
            if (String(storageChange.newValue) != String(nicknames)) {
                anythingChange = true;
                nicknames = storageChange.newValue;
                alert('nicknames Ids updated to ' + nicknames);
            }
        }

        else if (key === "onlineEmails") {
            if (String(storageChange.newValue) != String(emails)) {
                anythingChange = true;
                emails = storageChange.newValue;
                alert("emails updated to " + emails)
            }
        }
    }

    if (anythingChange) {
        chrome.contextMenus.removeAll();
        initializeMenus();
    }
});

/** Opens a new tab on their computer */
function openNewTab() {
    chrome.tabs.create({ url: route + user });
}

function initializeMenus() {
    var ids = [];
    
    if (emails != undefined && contextIds != undefined && nicknames != undefined) {
        for (var i = 0; i < emails.length; i++) {
            ids = [];
            for (var k = 0; k < contextIds.length; k++) {
                if (contextIds[k].includes(emails[i]))
                    ids.push(contextIds[k].substring(emails[i].length));
            }

            addMenus(emails[i], ids, nicknames[i], true);
        }
    }

}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {


    if (request.message === "addAccount") {
        alert(request.newAccounts);
        if (request.newEmail.length == 0) {
            alert("Please enter an email");
            return;
        }

        if (request.newAccounts.length == 0) {
            alert("Please check a desired link. (Calendar, Drive, or Gmail)");
            return;
        }

        if (request.nickname.length == 0) {
            alert("Please enter a nickname");
            return;
        }

        for (var k = 0; k < request.newAccounts.length; k++) {
            for (var i = 0; i < contextIds.length; i++) {
                if (request.newEmail + request.newAccounts[k] === contextIds[i]) {
                    alert("The shortcut for " + request.newEmail + " " + request.newAccounts[k] + " already exists");
                    request.newAccounts.splice(k, 1);
                }
            }
        }

        for (var i = 0; i < nicknames.length; i++) {
            if (nicknames[i] === request.nickname) {
                alert("Nickname " + request.nickname + " already taken.");
                return;
            }
        }
        //nicknames.push(request.nickname);
        //emails.push(request.newEmail);
        addMenus(request.newEmail, request.newAccounts, request.nickname, false);
        //sendResponse({ message: "hi to you" });
    }

    else if (request.message === "deleteAccount") {
        var isThere = false;

        for (var i = 0; i < emails.length; i++) {
            if (emails[i] === request.newEmail)
                isThere = true;
        }


        if (isThere) {
            deleteMenus(request.newEmail);
            for (var k = 0; k < contextIds.length; k++) {
                if (contextIds[k].includes(request.newEmail)) {
                    contextIds.splice(k, 1);
                    k = k - 1;
                }
            }
            alert("Account deleted");
        }
        else {
            alert("Email doesn't exist");
        }
        alert("emails " + emails);
        alert("nicknames " + nicknames);
        alert("contextIds " + contextIds);
    }

    else if (request.message === "displayValues") {
        displayValues();
    }

    chrome.storage.sync.set({ onlineEmails: emails });
    chrome.storage.sync.set({ oContextIds: contextIds });
    chrome.storage.sync.set({ oNicknames: nicknames });
});


function deleteMenus(email) {
    var index = emails.indexOf(email);
    if (index > -1) {
        emails.splice(index, 1);
        nicknames.splice(index, 1);
    }
    index = contextIds.indexOf(email)
    chrome.contextMenus.remove(email);
}

function addMenus(email, accounts, nickname, isStartUp) {
    var check = false;


    for (var i = 0; i < contextIds.length; i++) {
        if (contextIds[i].includes(email)) {
            check = true;
        }
    }


    if (!check || isStartUp) {

        chrome.contextMenus.create({
            title: nickname,
            id: email,
            contexts: ["all"],
        });
    }

    alert("accounts " + accounts);
    for (var i = 0, max = accounts.length; i < max; i++) {
        if (accounts[i] === "gmail") {
            chrome.contextMenus.create({
                title: "Gmail",
                id: email + accounts[i],
                parentId: email,
                contexts: ["all"],
                onclick: function () {
                    route = 'https://mail.google.com/mail/u/?authuser=';
                    user = email;
                    openNewTab();
                }
            });
        }

        else if (accounts[i] === "drive") {
            chrome.contextMenus.create({
                title: "Drive",
                id: email + accounts[i],
                parentId: email,
                contexts: ["all"],
                onclick: function () {
                    route = 'https://drive.google.com/drive/u/?authuser=';
                    user = email;
                    openNewTab();
                }
            });
        }

        else if (accounts[i] === "calendar") {
            chrome.contextMenus.create({
                title: "Calendar",
                id: email + accounts[i],
                parentId: email,
                contexts: ["all"],
                onclick: function () {
                    route = 'https://calendar.google.com/calendar/?authuser=';
                    user = email;
                    openNewTab();
                }
            });
        }

        if (!isStartUp) {
            contextIds.push(email + accounts[i])
            emails.push(email);
            nicknames.push(nickname);
        }
        
    }

    alert("Account shortcut(s) added");
}

function displayValues() {
    chrome.storage.sync.get("oNicknames", function (result) {
        alert("nicknames: " + result.oNicknames);
    });


    /** Get the context ID's from the cloud storage */
    chrome.storage.sync.get("oContextIds", function (result) {
        alert("contextIds: " + result.oContextIds);
    });

    /** Gets the emails from the cloud storage */
    chrome.storage.sync.get("onlineEmails", function (result) {
        alert("onlineEmails: " + result.onlineEmails);
    });
}
