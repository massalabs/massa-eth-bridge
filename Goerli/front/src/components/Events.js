import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { providers } from "ethers";
import './Events.css';

import { CONTRACT_ADDRESS_SWAP_ERC20 } from '../constant'

const Events = () => {

    // Creating variable to store user input
    const [inputValues, setInputValues] = useState([]);
    const [swap, setSwap] = useState([]);

    // Importing ABI of contract
    const swapERC20 = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");

    // Creating provider and signer
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    // Instantiating contracts to interact with them
    const contract_SWAP_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, provider);

    const handleInputChange = (index) => (event) => {
        const updatedInputValues = [...inputValues];
        updatedInputValues[index] = event.target.value;
        setInputValues(updatedInputValues);
    };

    // Running when form are submited
    const handleSubmit = (ID, index) => async (event) => {
        event.preventDefault();

        const secretKey = inputValues[index]
        const secretKeyInBytes = ethers.utils.toUtf8Bytes(secretKey);
        const swapWithSigner = contract_SWAP_ERC20.connect(signer);
        // Creating tx and send to close swap
        await swapWithSigner.close(ID, secretKeyInBytes);
    };

    // Runinng when component instantiating
    useEffect(() => {
        async function fetchSwaps() {
            function compareAndRemove(list1, list2) {
                let result = []
                let incr = 0
                for (let i = 0; i < list1.length; i++) {
                    for (let j = 0; j < list2.length; j++) {
                        if (list1[i].args._swapID !== list2[j].args._swapID) {
                            incr = incr + 1
                        }
                        if (incr === list2.length) {
                            result.push(list1[i])
                        }
                    }
                    incr = 0
                }
                return result
            }
            // Getting all swap in statut "OPEN"
            const filterOpen = contract_SWAP_ERC20.filters.Open()
            const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)

            // Getting all swap in statut "CLOSE"
            const filterClose = contract_SWAP_ERC20.filters.Close()
            const logsClose = await contract_SWAP_ERC20.queryFilter(filterClose)

            // Deleting swap in OPEN when swap in statut CLOSE exist with same secretKey
            setSwap(compareAndRemove(logsOpen, logsClose))
        }
        fetchSwaps()

    }, []);


    return (
        <div className="ListHTLC">
            <h1>
                Swap List :
            </h1>
            <div>
                {swap.map((item, index) => (
                    <div>
                        <table key={index}>
                            <tbody>
                                <tr>
                                    <th scope="col">swapID</th>
                                    <th scope="col">swapID In Hex</th>
                                    <th scope="col">address of withdraw</th>
                                    <th scope="col">secretLock</th>
                                </tr>
                                <tr>
                                    <td>{String.fromCharCode(...item.args._swapID.substr(2).match(/.{2}/g).map(function (a) {
                                        return parseInt(a, 16);
                                    }))}</td>
                                    <td>{item.args._swapID.replace(/0+$/, '')}</td>
                                    <td>{item.args._withdrawTrader.substring(0, 10) + "..."}</td>
                                    <td>{item.args._secretLock}</td>
                                </tr>
                            </tbody>
                        </table>
                        <form onSubmit={handleSubmit(item.args._swapID, index)}>
                            <div>
                                <label>SecretKey</label>
                                <input type="text" value={inputValues[index] || ''} onChange={handleInputChange(index)} />
                                <button type="submit">Close</button>
                            </div>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default Events;