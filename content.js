//TODO: See if there's a better way than using global vars
//TODO: Fix bug with overlapping emails

var accounts = [];

/** Gets the accounts from the cloud storage */
chrome.storage.sync.get("oAccounts", function (result) {
    if (result.oAccounts !== undefined)
        accounts = result.oAccounts;
    else
        accounts = [];    
    initializeMenus();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let sameEmail = false;
    let difNickName = false;

    if (request.message === "addAccount") {
        let newAccount;
        if (request.newEmail.length == 0) {
            alert("Please enter an email");
            return;
        }

        if (request.newServices.length == 0) {
            alert("Please check a desired link. (Calendar, Drive, or Gmail)");
            return;
        }

        if (request.newNickName.length == 0) {
            alert("Please enter a nickname");
            return;
        }

        if (accounts != undefined) {
            accounts.forEach(element => {
                if (request.newEmail == element.email) {
                    sameEmail = true;
                    // Covers the case where they may request to add an email that already exists with a 
                    // nickname that differs from the existing nickname
                    if (request.newNickName != element.nickName) {
                        alert("An account with this email already exists under the nickname: " + element.nickName +
                            "\nUse that nickname to add more links or delete the email to start over with a new nickname.")
                        difNickName = true;
                    }
                    if (!difNickName && sameEmail) {
                        element.services.forEach(check => {
                            request.newServices.forEach(newServ => {
                                if (check === newServ) {
                                    alert(request.newEmail + " " + check + " already exists.")
                                    request.newServices.splice(request.newServices.indexOf(check), 1);
                                }
                            });
                        });
                    }
                }
            });

            if (difNickName)
                return;
        }

        // Make sure that there are still some services that need to be added 
        // & that they weren't all duplicate services
        if (request.newServices.length == 0)
            return;
        else {
            newAccount = createOrUpdateAccount(request.newEmail, request.newNickName, request.newServices, sameEmail);
            addMenus(newAccount, false, sameEmail);
        }
    }

    else if (request.message === "deleteAccount") {
        // Holds if the email is a an email that exists in accounts[]
        var isThere = false;

        //Determine if the email exists in accounts[]
        accounts.forEach(element => {
            if (element.email === request.newEmail)
                isThere = true;
        });
        


        if (isThere) {
            deleteAccount(request.newEmail);
            alert("Account deleted");
        }
        else {
            alert("Email doesn't exist");
        }
    }

    //T
    // else if (request.message === "displayValues") {
    //     displayValues();
    // }

    chrome.storage.sync.set({"oAccounts": accounts})
});


function deleteAccount(email) {
    let index = -1;
    accounts.forEach(element => {
        if (element.email === email)
            accounts.splice(index, 1);
    });
    
    chrome.contextMenus.remove(email);
}

function addMenus(newAccount, isStartUp, sameEmail) {
    // var check = false;

    //Add each account into 
    if (!sameEmail) {
        chrome.contextMenus.create({
            title: newAccount.nickName,
            id: newAccount.email,
            contexts: ["all"]
        });
    
    }

    try {
        newAccount.services.forEach(accService => {
            chrome.contextMenus.create({
                title: accService,
                id: newAccount.email + accService,
                parentId: newAccount.email,
                contexts: ["all"],
                onclick: function () {
                    if (accService === "Gmail")
                        route = "https://mail.google.com/mail/u/?authuser=";
                    else if (accService === "Drive")
                        route = "https://drive.google.com/drive/u/?authuser=";
                    else if (accService === "Calendar")
                        route = "https://calendar.google.com/calendar/?authuser="
                    user = newAccount.email;
                    openNewTab(route, user);
                }
            });
        });
    }

    catch (err) {
        //Empty catch statement to catch any errors with overlapping functions
    }
}

function initializeMenus() {

    accounts.forEach(newAccount => {
        chrome.contextMenus.create({
            title: newAccount.nickName,
            id: newAccount.email,
            contexts: ["all"]
        });
        newAccount.services.forEach(accService => {
            chrome.contextMenus.create({
                title: accService,
                id: newAccount.email + accService,
                parentId: newAccount.email,
                contexts: ["all"],
                onclick: function () {
                    if (accService === "Gmail")
                        route = "https://mail.google.com/mail/u/?authuser=";
                    else if (accService === "Drive")
                        route = "https://drive.google.com/drive/u/?authuser=";
                    else if (accService === "Calendar")
                        route = "https://calendar.google.com/calendar/?authuser="
                    user = newAccount.email;
                    openNewTab();
                }
            });
        });
    });
}


/** Opens a new tab on their computer */
function openNewTab(route, user) {
    chrome.tabs.create({ url: route + user });
}

/** Displays the value of the accounts */
function displayValues() {
    chrome.storage.sync.get("oAccounts", function (result) {
        alert("accounts: " + JSON.stringify(result.oAccounts));
    });

}

function createOrUpdateAccount(newEmail, newNickName, newServices, sameEmail) {
    let newAccount = {
        email: newEmail,
        nickName: newNickName,
        services: newServices
    };
    if (!sameEmail) {
        accounts.push(newAccount);
    }

    else {
        accounts.forEach(element => {
            if (element.email === newEmail) {
                newServices.forEach(newServ => {
                    element.services.push(newServ)
                });
            }
        });
    }

    return newAccount;
}