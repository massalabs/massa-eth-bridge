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

    function hexToBytes(hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    function toHexString(byteArray) {
        return Array.from(byteArray, function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    // Running when form are submited
    const handleSubmit = (ID, index) => async (event) => {
        event.preventDefault();

        const secretKey = inputValues[index]
        // Convert hex string to unint8array
        const secretKeyInBytes = new Uint8Array(hexToBytes(secretKey))
        // Convert hex unint8array to string and add "0x"
        const secretKeyInString = "0x" + toHexString(secretKeyInBytes)
        const swapWithSigner = contract_SWAP_ERC20.connect(signer);
        // Creating tx and send to close swap
        await swapWithSigner.close(ID, secretKeyInString);
    };


    // Running when form are submited
    const handleSubmitClose = (ID) => async (event) => {
        event.preventDefault();
        const swapWithSigner = contract_SWAP_ERC20.connect(signer);
        // Creating tx and send to expire swap
        await swapWithSigner.expire(ID);
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

            // Getting all swap in statut "EXPIRE"
            const filterExpire = contract_SWAP_ERC20.filters.Expire()
            const logsExpire = await contract_SWAP_ERC20.queryFilter(filterExpire)

            // Deleting swap in OPEN when swap in statut CLOSE exist with same secretKey
            const OpenAndExpire = compareAndRemove(logsOpen, logsClose)
            // Deleting swap in OPEN when swap in statut EXPIRE exist with same secretKey
            console.log(compareAndRemove(OpenAndExpire, logsExpire))
            setSwap(compareAndRemove(OpenAndExpire, logsExpire))
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
                        <form onSubmit={handleSubmitClose(item.args._swapID)}>
                            <div>
                                <button type="submit">Expire</button>
                            </div>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default Events;