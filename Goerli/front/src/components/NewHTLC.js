import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { providers } from "ethers";
import './NewHTLC.css';

import { CONTRACT_ADDRESS_SWAP_ERC20 } from '../constant'
import { CONTRACT_ADDRESS_ERC20 } from '../constant'

const NewHTLC = () => {

    const receiverRef = React.useRef();
    const timelockRef = React.useRef();
    const amountRef = React.useRef();
    const passwordRef = React.useRef();
    const allowanceRef = React.useRef();

    const [symbol, setsymbol] = useState("");
    const [name, setname] = useState("");
    const [allowance, setAllowance] = useState("");
    const [swaps, setSwaps] = useState([]);

    const swapERC20 = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");
    const contractERC20 = require("../contracts/Token.sol/TokenA.json");

    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    const contract_SWAP_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, signer);
    const contract_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_ERC20, contractERC20.abi, signer);
    const contract_SWAP_ERC20_provider = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, provider);

    useEffect(() => {
        async function allowance() {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const allowance = await contract_ERC20.allowance(accounts[0], CONTRACT_ADDRESS_SWAP_ERC20)
            setAllowance(parseInt(allowance._hex, 16))
        }
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        const receiver = receiverRef.current.value
        const amount = Number(amountRef.current.value)
        const timelock = Number(timelockRef.current.value)
        const password = passwordRef.current.value

        const passwordInBytes = ethers.utils.toUtf8Bytes(password)
        const hash = ethers.utils.sha256(passwordInBytes)


        const filterOpen = contract_SWAP_ERC20.filters.Open()
        const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)
        const lastId = logsOpen[logsOpen.length -1].args._swapID
        const newId = parseInt(String.fromCharCode(...lastId.substr(2).match(/.{2}/g).map(function (a) {
            return parseInt(a, 16);
        }))) + 1
        const newIdInString = newId.toString()
        const ID = ethers.utils.formatBytes32String(newIdInString)

        if (amount > 0 && amount < allowance && timelock >= 0) {
            const swapWithSigner = contract_SWAP_ERC20.connect(signer)
            const openHTLC = swapWithSigner.open(ID, amount, CONTRACT_ADDRESS_ERC20, receiver, hash, timelock)
        } else {
            alert('error')
        }
    };

    const encreaseAllowance = async (event) => {
        event.preventDefault();

        const allowanceAmount = Number(allowanceRef.current.value)
        const allowance = await contract_ERC20.increaseAllowance(CONTRACT_ADDRESS_SWAP_ERC20, allowanceAmount)
    }

    return (
        <div className="HTLC">
            <div className="NewHTLC">
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="receiver">Receiver</label>
                        <input id="receiver" type="text" ref={receiverRef} />
                    </div>
                    <div>
                        <label htmlFor="amount">Amount</label>
                        <input id="amount" type="number" ref={amountRef} />
                    </div>
                    <div>
                        <label htmlFor="timelock">Timelock</label>
                        <input id="timelock" type="number" ref={timelockRef} />
                    </div>
                    <div>
                        <label htmlFor="password">Password</label>
                        <input id="password" type="text" ref={passwordRef} />
                    </div>
                    <button type="submit">Create</button>
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
                <form onSubmit={encreaseAllowance}>
                    <div>
                        <label htmlFor="allowance">Amount</label>
                        <input id="allowance" type="number" ref={allowanceRef} />
                    </div>
                    <button type="submit">increase</button>
                </form>
            </div>
        </div>
    )
}
export default NewHTLC;