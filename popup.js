var route = '';
var user = '';

function addContextMenu(accounts) {
  email = (document.getElementById('email').value);
  accName = (document.getElementById('accName').value);

  document.getElementById('email').value = '';
  document.getElementById('accName').value = '';

  chrome.runtime.sendMessage({ message: "addAccount", newEmail: email, newAccounts: accounts, nickname: accName });
}

function deleteContextMenus(email) {
  chrome.runtime.sendMessage({ message: "deleteAccount", newEmail: email });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("form").addEventListener('submit', function (e) {
    emails = [];
    e.preventDefault();
    var getInputs = document.getElementsByTagName("input");
    for (var i = 0, max = getInputs.length; i < max; i++) {
      if (getInputs[i].type === 'checkbox') {
        if (getInputs[i].checked === true) {
          emails.push(getInputs[i].value);
          alert(getInputs[i].value)
        }
      }
    }
    alert(emails);
    addContextMenu(emails);

  })

  document.getElementById("delete").addEventListener('submit', function (e) {
    emails = [];
    e.preventDefault();
    deleteContextMenus(document.getElementById('deleteEmail').value);
    document.getElementById('deleteEmail').value = '';

  })

  document.getElementById("newForm").addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({active: true, url: "https://www.google.com/"});
  })
}, false);
