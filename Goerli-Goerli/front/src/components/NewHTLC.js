import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { AlchemyProvider } from 'ethers';
import './NewHTLC.css';
import { contractAbi } from '../abi/abi';

const NewHTLC = () => {
    const receiverRef = React.useRef();
    const timelockRef = React.useRef();
    const amountRef = React.useRef();

    const provider = new AlchemyProvider("goerli", "kWBvEiso-d70OEPlThp6oJknYBr6XMlO")


    const handleSubmit = async (event) => {
        event.preventDefault();

        const receiver = receiverRef.current.value
        const amount = amountRef.current.value
        const timelock = timelockRef.current.value

        console.log(receiver + ' ' + amount + ' ' + timelock);

        const block = await provider.getBlockNumber()
        console.log(block)
    };

    return (
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
                <button type="submit">Create</button>
            </form>
        </div>
    )
}
export default NewHTLC;