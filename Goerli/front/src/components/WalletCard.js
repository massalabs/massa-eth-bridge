import React, { Component }  from 'react';
import { useState } from 'react';
import { ethers } from "ethers";
import './WalletCard.css';

const WalletCard = () => {
    // Properties

    const [walletAddress, setWalletAddress] = useState("");
    const [walletBalance, setWalletBalance] = useState("");

    async function requestAccount() {
        console.log('Requesting account...');

        // ❌ Check if Meta Mask Extension exists 
        if (window.ethereum) {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            //const provider = new ethers.getDefaultProvider("goerli")
            //const provider = new ethers.AlchemyProvider("goerli", "kWBvEiso-d70OEPlThp6oJknYBr6XMlO")
            const balance = await window.ethereum.request({
                method:'eth_getBalance', 
                params: [accounts[0], 'latest']
            })
            setWalletAddress(accounts[0]);
            setWalletBalance(ethers.utils.formatEther(balance))

        } else {
            alert('Meta Mask not detected');
        }
    }

    return (
        <div className="WalletCard">
            <h3 className="h4" id="welcome">
                Welcome to a decentralized Application
            </h3>
            <div className="displayAccount">
                <h4 className="walletAddress">Address: {walletAddress} </h4>
                <div className="balanceDisplay">
                    <h3>
                        Wallet Amount: {walletBalance}
                    </h3>
                </div>
            </div>
            <button id="metamask" onClick={requestAccount}>CONNECT WALLET(METAMASK) </button>
        </div>
    )
}
export default WalletCard;