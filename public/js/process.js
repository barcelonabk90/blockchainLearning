/** @var Web3 web3 */
let web3 = null;
/** Current logging in wallet address */
let currentAccount;
/** contract Address */
const quyLopAddress = "0xa5718D80b02F0EcE05B24C17e96c48EAe1bE1a17";
/** contract ABI */
const quyLopABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "depositHasBeenUpdate",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "countStudent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getStudentInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "showTotalAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const WSS_INFURA = "wss://rinkeby.infura.io/ws/v3/bd1ebd1d254d43219133d79cda1b8dfa";
let quyLopContractMM = null;
let quyLopContractInfra = null;
let provider = null;

$(function () {

  controlDisplayMetaMask();

  // Click to Login MetaMask Button
  $("#login-metamask-btn").on('click', function () {
    loginMetaMask().then(data => {
      if (data != []) {
        currentAccount = data[0];
        $("#currentAccount").html(currentAccount);
        updateBalance(currentAccount);
      } else {
        console.log('Login meta mask failed !');
      }
    })
  });

  /**
   * When click to Deposit button
   * 1. Check MetaMask has been login ? If not show alert and exit
   * 2. Check the name field has been input ? If not show alert and exit
   * 3. Check the amount field has been input ? If not show alert and exit
   * 4. Send params to deposit method
   * @todo : Event & emit : when transaction is completed, update the table of list students
   */
  $("#deposit-btn").on('click', function () {
    if (!currentAccount) {
      alert("Please login meta mask first !");
      return;
    }

    const name = $("#sender-name").val();
    const amount = $("#sender-amount").val();

    if (name.length === 0) {
      alert("Please input your name !");
      return;
    }

    if (amount.length === 0) {
      alert("Please input amount of money !");
      return;
    }

    quyLopContractMM.methods.deposit(name).send({
      from: currentAccount,
      value: web3.utils.toWei(amount, "ether")
    }).then((data) => {
      console.log('OK');
      console.log(data);
    }).catch((err) => {
      console.log('Error has occured !!! ' + err);
    });

  });

  loadStudentList();

  // Listen MetaMask account changed event 
  window.ethereum.on('accountsChanged', function (accounts) {
    currentAccount = accounts[0];
    $("#currentAccount").html(currentAccount);
    updateBalance(currentAccount);
  });

  /**
   * When someone send to deposit transaction successfully, get event notification and render data 
   */
  quyLopContractInfra.events.depositHasBeenUpdate({ filter: {}, fromBlock: "latest" }, function (err, data) {
    if (!err) {
      $("#tbl-student-body").append(`
            <tr>
              <td>${data.returnValues[0]}</td>
              <td>${data.returnValues[1]}</td>
              <td>${convertToEth(data.returnValues[2])}</td>
            <tr>
            `);
    } else {
      console.log(err);
    }
  });

});

/**
 * Load all students and display on the table
 */
const loadStudentList = function () {
  $("#tbl-student-body").empty();
  // Get total number of students
  quyLopContractMM.methods.countStudent().call()
    .then((total) => {
      // convert Big Number to string(int)
      const studentCnt = web3.utils.hexToNumberString(total);
      for (let i = 0; i < studentCnt; i++) {
        // Get every student's info and append to table
        quyLopContractMM.methods.getStudentInfo(i).call()
          .then((data) => {
            $("#tbl-student-body").append(`
            <tr>
              <td>${data[0]}</td>
              <td>${data[1]}</td>
              <td>${convertToEth(data[2])}</td>
            <tr>
            `);
          })
          .catch((err) => {
            console.log(`Error has occured !!! Cant get info of student ${i + 1}th ` + err);
          });
      }
    })
    .catch((err) => {
      console.log(`Error has occured !!! Cant get total number of students` + err);
    });
}

/**
 * Convert wei Big Number to ETH
 * @param {Big Number} wei 
 * @returns Float
 */
const convertToEth = function (wei) {
  return web3.utils.fromWei(web3.utils.hexToNumberString(wei), 'ether');
}

/**
 * Check MetaMask has been installed or not !
 * @returns bool
 */
const checkMetaMask = function () {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Control the display/hide of Login MetaMask DIV and Install MetaMask DIV
 * Check MetaMask has been installed ?
 * If MetaMask has been installed, init web3 and web3 contract
 */
const controlDisplayMetaMask = function () {
  if (checkMetaMask) {
    console.log("Da cai meta mask !");
    $("#login-metamask").show();
    $("#install-metamask").hide();
    web3 = new Web3(window.ethereum);
    quyLopContractMM = web3.eth.Contract(quyLopABI, quyLopAddress);
    provider = new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/bd1ebd1d254d43219133d79cda1b8dfa");
    let web3Infura = new Web3(provider);
    quyLopContractInfra = web3Infura.eth.Contract(quyLopABI, quyLopAddress);
  } else {
    console.log("Chua cai meta mask !");
    $("#login-metamask").hide();
    $("#install-metamask").show();
  }
}

/**
 * Login to MetaMask and return accounts
 * @returns array
 */
async function loginMetaMask() {
  if (checkMetaMask) {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    return accounts;
  }
  return [];
}

/**
 * Get the balance of specific wallet address
 * @param {string} address 
 * @returns 
 */
async function getAccountBalance(address) {
  const ethBalance = await web3.eth.getBalance(address);
  return web3.utils.fromWei(ethBalance, 'ether');
}

/**
 * Update the balance of specific wallet address
 * @param {string} address 
 */
function updateBalance(address) {
  getAccountBalance(address).then((data) => {
    $("#currentEthBalance").html(parseFloat(data).toFixed(4));
  });
}
