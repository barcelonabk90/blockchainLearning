const checkMetaMask = function () {
  return typeof window.ethereum !== 'undefined';
}

const controlDisplayMetaMask = function () {
  if (checkMetaMask) {
    console.log("Da cai meta mask !");
    $("#login-metamask").show();
    $("#install-metamask").hide();
  } else {
    console.log("Chua cai meta mask !");
    $("#login-metamask").hide();
    $("#install-metamask").show();
  }
}

async function loginMetaMask() {
  if (checkMetaMask) {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    return accounts;
  }
  return [];
}

$(function () {
  let currentAccount;
  // const web3 = new Web3(window.ethereum);
  controlDisplayMetaMask();

  // Click to Login MetaMask Button
  $("#login-metamask-btn").on('click', function () {
    loginMetaMask().then(data => {
      if (data != []) {
        currentAccount = data[0];
        $("#currentAccount").html(currentAccount);
      } else {
        console.log('Login meta mask failed !');
      }
    })
  });

  // Listen MetaMask account changed event 
  window.ethereum.on('accountsChanged', function (accounts) {
    currentAccount = accounts[0];
    $("#currentAccount").html(currentAccount);
  });

});

