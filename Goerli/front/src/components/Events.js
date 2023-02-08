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
                let result = []
                let incr = 0
                for (let i = 0; i < list1.length; i++) {
                    for (let j = 0; j < list2.length; j++) {
                        if (list1[i].args._swapID !== list2[j].args._swapID) {
                            incr = incr + 1
                        }
                        if (incr == list2.length) {
                            result.push(list1[i])
                        }
                    }
                    incr = 0
                }
                return result
            }
            const filterOpen = contract_SWAP_ERC20.filters.Open()
            const logsOpen = await contract_SWAP_ERC20.queryFilter(filterOpen)

            const filterClose = contract_SWAP_ERC20.filters.Close()
            const logsClose = await contract_SWAP_ERC20.queryFilter(filterClose)
            console.log(logsOpen)
            setSwap(compareAndRemove(logsOpen, logsClose))
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
                                <th scope="col">_swapID</th>
                                <th scope="col">_swapID In Hex</th>
                                <th scope="col">_withdrawTrader</th>
                                <th scope="col">_secretLock</th>
                            </tr>
                            <tr>
                                <td>{String.fromCharCode(...item.args._swapID.substr(2).match(/.{2}/g).map(function (a) {
                                    return parseInt(a, 16);
                                }))}</td>
                                <td>{item.args._swapID}</td>
                                <td>{item.args._withdrawTrader}</td>
                                <td>{item.args._secretLock}</td>
                            </tr>
                        </tbody>
                    </table>
                ))}
            </div>
        </div>
    )
}
export default Events;