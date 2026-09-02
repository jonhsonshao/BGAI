const URL_REF = new URLSearchParams(location.search).get("ref") || "";

const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const RECEIVE_ADDRESS = "0xaD8BdEf075C651eBadB0ffC0023B167d9211ed21";

let web3;
let currentAccount = null;
const BSC_CHAIN_ID = 56;

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const walletBtn = document.getElementById("walletBtn");

if(menuBtn && sideMenu){
    menuBtn.onclick = function(){
        sideMenu.classList.toggle("open");
    };
}

function formatAddress(addr){
    if(!addr) return "";
    return addr.slice(0,6) + "****" + addr.slice(-4);
}

function getRefData(addr){
    if(!addr) return {};
    return JSON.parse(localStorage.getItem("user_ref_" + addr.toLowerCase()) || "{}");
}

function setRefData(addr, data){
    if(!addr) return;
    localStorage.setItem("user_ref_" + addr.toLowerCase(), JSON.stringify(data));
}

function bindReferral(userAddr, superAddr){
    if(!userAddr || !superAddr) return false;

    let userData = getRefData(userAddr);

    if(userData.superior) return false;

    if(userAddr.toLowerCase() === superAddr.toLowerCase()) return false;

    userData.superior = superAddr.toLowerCase();
    userData.bindTime = Date.now();
    setRefData(userAddr, userData);

    let superData = getRefData(superAddr);
    if(!superData.team) superData.team = [];

    if(!superData.team.includes(userAddr.toLowerCase())){
        superData.team.push(userAddr.toLowerCase());
    }

    setRefData(superAddr, superData);

    return true;
}

function updateWalletUI(){
    if(!walletBtn) return;

    if(currentAccount){
        walletBtn.innerText = "已链接：" + formatAddress(currentAccount);
    }else{
        walletBtn.innerText = "连接钱包";
    }

    window.dispatchEvent(new CustomEvent(currentAccount ? "walletConnected" : "walletDisconnected"));
}

async function switchBSC(){
    try{
        await window.ethereum.request({
            method:"wallet_switchEthereumChain",
            params:[{chainId:"0x38"}]
        });
    }catch(e){
        console.error("切换链失败", e);
    }
}

async function getAccounts(){
    if(!window.ethereum){
        alert("未检测到钱包，请安装TP/Metamask钱包");
        return null;
    }

    web3 = new Web3(window.ethereum);

    const accounts = await window.ethereum.request({
        method:"eth_requestAccounts"
    });

    return accounts[0] || null;
}

async function autoConnectWallet(){
    if(!window.ethereum) return;

    try{
        web3 = new Web3(window.ethereum);

        const accounts = await window.ethereum.request({
            method:"eth_accounts"
        });

        if(accounts.length > 0){
            currentAccount = accounts[0];
            await switchBSC();
            updateWalletUI();
        }
    }catch(err){
        console.log("自动连接无授权", err);
    }
}

if(walletBtn){
    walletBtn.onclick = async function(){
        if(currentAccount){
            navigator.clipboard.writeText(currentAccount);
            alert("钱包地址已复制：" + currentAccount);
            return;
        }

        try{
            currentAccount = await getAccounts();
            await switchBSC();
            updateWalletUI();
        }catch(err){
            console.error("用户取消连接", err);
        }
    };
}

if(window.ethereum){
    window.ethereum.on("accountsChanged", (accounts)=>{
        currentAccount = accounts.length > 0 ? accounts[0] : null;
        updateWalletUI();
        window.dispatchEvent(new CustomEvent("accountsChanged"));
    });

    window.ethereum.on("chainChanged", ()=>{
        window.location.reload();
    });
}

window.onload = function(){
    autoConnectWallet();
};
