var route = '';
var user = '';

function addContextMenu(accounts) {
  email = (document.getElementById('email').value);
  accName = (document.getElementById('accName').value);
  accounts = getChckdAccts("srvcs");

  document.getElementById('email').value = '';
  document.getElementById('accName').value = '';

  chrome.runtime.sendMessage({ message: "addAccount", newEmail: email, newServices: accounts, newNickName: accName });
}

function deleteContextMenus(email) {
  chrome.runtime.sendMessage({ message: "deleteAccount", newEmail: email });
}


/** Iterates through the checked checkboxes with name "checkboxName"
 * in popup.html
 * @returns an array of the checked checkboxes
 */
function getChckdAccts(checkboxName){
  var checkboxes = document.getElementsByName(checkboxName);
  var checkedCheckboxes = [];
  for (var i = 0; i < checkboxes.length; i++){
    if(checkboxes[i].checked){
      checkedCheckboxes.push(checkboxes[i].value);
    }
  }

  return checkedCheckboxes;
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
        }
      }
    }
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
    chrome.tabs.create({ active: true, url: "https://forms.gle/xMMv2oVKVbzUsMLj6"});
  })

  //Just used for testing
  // document.getElementById("showValues").addEventListener('click', function (e) {
  //   e.preventDefault();
  //   chrome.runtime.sendMessage({ message: "displayValues" });
  // })
}, false);
