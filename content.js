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

/** Listens for a message that is sent by popup.js & then takes different actions
 * depending on the message
 */
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
            addMenus(newAccount, sameEmail);
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

    chrome.storage.sync.set({ "oAccounts": accounts })
});


/** Deletes the specified email account from the accounts array & removes it from the contextMenus */
function deleteAccount(email) {
    let index = -1;
    accounts.forEach(element => {
        if (element.email === email)
            accounts.splice(index, 1);
    });

    chrome.contextMenus.remove(email);
}


/** 
 * Adds the specified context menu
 * @param newAccount is an account object
 * @param sameEmail is a boolean that is true if the email already exists in the account array (but may still be adding 
 * new accounts)
 */
function addMenus(newAccount,  sameEmail) {
    //Add each account into 
    if (!sameEmail) {
        chrome.contextMenus.create({
            title: newAccount.nickName,
            id: newAccount.email,
            contexts: ["all"]
        });

    }

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

/**
 * Adds the contextMenus back when Chrome starts up
 */
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
                    openNewTab(route, user);
                }
            });
        });
    });
}


/** Opens a new tab with the designated url */
function openNewTab(route, user) {
    chrome.tabs.create({ url: route + user });
}

/** Displays the value of the accounts. Mostly used for testing */
function displayValues() {
    chrome.storage.sync.get("oAccounts", function (result) {
        alert("accounts: " + JSON.stringify(result.oAccounts));
    });

}


/** 
 * Creates or updates an account depending on if the email already existed in the accounts array
 * @param newEmail contains the email of the account
 * @param newNickName the nickname for the account
 * @param newServices the Google service(s) to add for the account (Calendar, Gmail, etc)
 * @param sameEmail boolean that is true if @newEmail already exists in the accounts array (and 
 * the user is likely just adding more service shortcuts to the account at that point)
 */
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