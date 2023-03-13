import React, { useState, useEffect } from 'react';
import { ethers, providers } from "ethers";
import './NewHTLC.css';

import { CONTRACT_ADDRESS_SWAP_ERC20 } from '../constant'
import { CONTRACT_ADDRESS_ERC20 } from '../constant'

const NewHTLC = () => {
    // Creating variable to store user input
    const receiverRef = React.useRef();
    const receiverRefSameSwap = React.useRef();
    const timelockRef = React.useRef();
    const timelockRefSameSwap = React.useRef();
    const amountRef = React.useRef();
    const amountRefSameSwap = React.useRef();
    const secretLockRef = React.useRef();
    const allowanceRef = React.useRef();

    // Creating variable to store smart contract infomration
    const [symbol, setsymbol] = useState("");
    const [name, setname] = useState("");
    const [allowance, setAllowance] = useState("");

    // Importing ABI of contract
    const swapERC20 = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");
    const contractERC20 = require("../contracts/Token.sol/TokenA.json");

    // Creating provider and signer
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    // Instantiating contracts to interact with them
    const contract_SWAP_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, signer);
    const contract_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_ERC20, contractERC20.abi, signer);

    function hexToBytes(hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    // Runinng when component instantiating
    useEffect(() => {
        // Getting to allowance of wallet connected
        async function allowance() {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const allowance = await contract_ERC20.allowance(accounts[0], CONTRACT_ADDRESS_SWAP_ERC20)
            setAllowance(parseInt(allowance._hex, 16))
        }
        // Getting to symbol and name of smart contract
        async function getSymbolName() {
            const contract = new ethers.Contract(CONTRACT_ADDRESS_ERC20, contractERC20.abi, provider);
            const symbol = await contract.symbol();
            const name = await contract.name();
            setname(name)
            setsymbol(symbol)
        }
        allowance()
        getSymbolName()
    })

    // Activation by form
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Getting value input by user
        const receiver = receiverRef.current.value
        const amount = Number(amountRef.current.value)
        const timelock = Number(timelockRef.current.value)

        // Creating random string and hash twice
        function makeid(length) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result;
        }
        const random = makeid(100)
        const randomInBytes = ethers.utils.toUtf8Bytes(random)
        const secretKey = ethers.utils.sha256(randomInBytes)

        // Convert hex string to unint8array and hash it
        const secretLock = ethers.utils.sha256(new Uint8Array(hexToBytes(secretKey)));

        // Display secret to user
        alert("This is your secret. Please note it down as it will be required to close the swap\nSecret: " + secretKey);

        // Getting all swap in statut "OPEN". Selecting last ID and increment 1.
        const filterOpen = contract_SWAP_ERC20.filters.Open()
        const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)
        const lastId = logsOpen[logsOpen.length - 1].args._swapID
        const newId = parseInt(String.fromCharCode(...lastId.substr(2).match(/.{2}/g).map(function (a) {
            return parseInt(a, 16);
        }))) + 1
        const newIdString = newId.toString()
        const ID = ethers.utils.formatBytes32String(newIdString)

        // Verifying amount input by user
        if (amount > 0 && amount < allowance && timelock >= 0) {
            // Creating tx and send to open swap
            //const amountFormatted = ethers.utils.parseUnits(amount.toString(), decimals);
            await contract_SWAP_ERC20.open(ID, amount, CONTRACT_ADDRESS_ERC20, receiver, secretLock, timelock)
        } else {
            alert('error in your inputs')
        }
    };

    // Activation by form
    const handleSubmitSame = async (event) => {
        event.preventDefault();

        // Getting value input by user
        const receiver = receiverRefSameSwap.current.value
        const amount = Number(amountRefSameSwap.current.value)
        const timelock = Number(timelockRefSameSwap.current.value)
        const secretLock = String(secretLockRef.current.value)
        console.log('your hash secret : ', secretLock)
        alert('Your secret will be revealed at the closing and your hash secret :' + secretLock)

        // Getting all swap in statut "OPEN". Selecting last ID and increment 1.
        const filterOpen = contract_SWAP_ERC20.filters.Open()
        const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)
        const lastId = logsOpen[logsOpen.length - 1].args._swapID
        const newId = parseInt(String.fromCharCode(...lastId.substr(2).match(/.{2}/g).map(function (a) {
            return parseInt(a, 16);
        }))) + 1
        const newIdString = newId.toString()
        const ID = ethers.utils.formatBytes32String(newIdString)

        // Verifying amount input by user
        if (amount > 0 && amount < allowance && timelock >= 0) {
            // Creating tx and send to open swap
            await contract_SWAP_ERC20.open(ID, amount, CONTRACT_ADDRESS_ERC20, receiver, secretLock, timelock)
        } else {
            alert('error in your inputs')
        }
    };

    // Starting to increase users's allowance
    const increaseAllowance = async (event) => {
        event.preventDefault();

        // Recovering of users input.
        const allowanceAmount = Number(allowanceRef.current.value)
        // Creating tx and send increase allowance
        await contract_ERC20.increaseAllowance(CONTRACT_ADDRESS_SWAP_ERC20, allowanceAmount)
    }

    return (
        <div className="HTLC">
            <div className="NewHTLC">
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="receiver">Receiver : </label>
                        <input id="receiver" type="text" ref={receiverRef} />
                    </div>
                    <div>
                        <label htmlFor="amount">Amount : </label>
                        <input id="amount" type="number" ref={amountRef} />
                    </div>
                    <div>
                        <label htmlFor="timelock">Timelock : </label>
                        <input id="timelock" type="number" ref={timelockRef} />
                    </div>
                    <button type="submit">Create New Swap</button>
                </form>
                <form onSubmit={handleSubmitSame}>
                    <div>
                        <label htmlFor="receiverSameSwap">Receiver : </label>
                        <input id="receiverSameSwap" type="text" ref={receiverRefSameSwap} />
                    </div>
                    <div>
                        <label htmlFor="amountSameSwap">Amount : </label>
                        <input id="amountSameSwap" type="number" ref={amountRefSameSwap} />
                    </div>
                    <div>
                        <label htmlFor="timelockSameSwap">Timelock : </label>
                        <input id="timelockSameSwap" type="number" ref={timelockRefSameSwap} />
                    </div>
                    <div>
                        <label htmlFor="secretLock">secretLock : </label>
                        <input id="secretLock" type="text" ref={secretLockRef} />
                    </div>
                    <button type="submit">Create the same swap as in Massa</button>
                </form>
            </div>
            <div>
                <h2>
                    Name:  {name}
                </h2>
                <h2>
                    Symbol: {symbol}
                </h2>
                <h2>
                    Your allowance: {allowance}
                </h2>
                <form onSubmit={increaseAllowance}>
                    <div>
                        <label htmlFor="allowance">Amount : </label>
                        <input id="allowance" type="number" ref={allowanceRef} />
                        <button type="submit">increase</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default NewHTLC;