import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { providers } from "ethers";
import './Events.css';

import { CONTRACT_ADDRESS_SWAP_ERC20 } from '../constant'

const Events = () => {

    const [swap, setSwap] = useState([]);

    const swapERC20 = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");

    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    const contract_SWAP_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, provider);


    useEffect(() => {

        async function fetchSwaps() {
            function compareAndRemove(list1, list2) {
                return list1.filter(function (item) {
                    return !list2.includes(item);
                });
            }

            let IDsOpen = []
            let IDsClose = []
            let SwapsString = []

            const filterOpen = contract_SWAP_ERC20.filters.Open()
            const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)

            const filterClose = contract_SWAP_ERC20.filters.Close()
            const logsClose = await contract_SWAP_ERC20.queryFilter(filterClose)

            for (let i in logsOpen) {
                IDsOpen.push(logsOpen[i].args._swapID)
                IDsClose.push(logsClose[i]?.args._swapID)
            }
            const SwapsInHex = compareAndRemove(IDsOpen, IDsClose)

            for (let i in SwapsInHex) {
                SwapsString.push(String.fromCharCode(...SwapsInHex[i].substr(2).match(/.{2}/g).map(function(a) {
                    return parseInt(a, 16);
                  })))
            }
            setSwap(SwapsString)
        }
        fetchSwaps()

    }, []);


    return (
        <div className="NewHTLC">
            <h1>
                Swap List :
            </h1>
            <div>
                {swap.map((item, index) => (
                    <table key={index}>
                        <tbody>
                            <tr>
                                <td>{item}</td>
                                <td>{item}</td>
                            </tr>
                        </tbody>
                    </table>
                ))}
            </div>
        </div>
    )
}
export default Events;