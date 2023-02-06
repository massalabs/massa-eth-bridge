
import { useState } from 'react';
import { ethers } from "ethers";

const WalletCard = () => {
    // Properties

    const [walletAddress, setWalletAddress] = useState("");
    const [walletBalance, setWalletBalance] = useState("");
    const [Block, setBlock] = useState("");

    async function requestAccount() {
        console.log('Requesting account...');

        // ❌ Check if Meta Mask Extension exists 
        if (window.ethereum) {
            console.log('detected');
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log(accounts[0])
            const provider = new ethers.getDefaultProvider("goerli")
            //const provider = new ethers.AlchemyProvider("goerli", "kWBvEiso-d70OEPlThp6oJknYBr6XMlO")
            const balance = await provider.getBalance(accounts[0])
            console.log(balance)
            const balanceInEther = ethers.formatEther(balance);
            const block = await provider.getBlockNumber();
            setWalletAddress(accounts[0]);
            setWalletBalance(balanceInEther);
            setBlock(block);

        } else {
            alert('Meta Mask not detected');
        }
    }

    return (
        <div className="WalletCard">
            <h3 className="h4">
                Welcome to a decentralized Application
            </h3>
            <button onClick={requestAccount}>CONNECT WALLET(METAMASK) </button>
            <div className="displayAccount">
                <h4 className="walletAddress">Address: {walletAddress} </h4>
                <div className="balanceDisplay">
                    <h3>
                        Wallet Amount: {walletBalance}
                    </h3>
                    <p> current block : {Block} </p>
                </div>
            </div>
        </div>
    )
}
export default WalletCard;