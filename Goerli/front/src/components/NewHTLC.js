import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { providers } from "ethers";
import { AlchemyProvider } from 'ethers';
import './NewHTLC.css';

import { CONTRACT_ADDRESS_SWAP_ERC20_A } from '../constant'
import { CONTRACT_ADDRESS_SWAP_ERC20_B } from '../constant'
import { CONTRACT_ADDRESS_ERC20_A } from '../constant'
import { CONTRACT_ADDRESS_ERC20_B } from '../constant'
import { PUBLIC_KEYA } from '../constant'
import { PUBLIC_KEYB } from '../constant'

const NewHTLC = () => {
    
    const [signer, setSigner] = useState(null);

    const receiverRef = React.useRef();
    const timelockRef = React.useRef();
    const amountRef = React.useRef();

    const swapERC20A = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");
    const swapERC20B = require("../contracts/SwapERC20B.sol/AtomicSwapERC20B.json");
    const contractERC20A = require("../contracts/Token.sol/TokenA.json");
    const contractERC20B = require("../contracts/Token.sol/TokenB.json");

    //const provider = new AlchemyProvider("goerli", "kWBvEiso-d70OEPlThp6oJknYBr6XMlO")
    const provider = new providers.Web3Provider(window.ethereum);

    const contract_SWAP_ERC20_A = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20_A, swapERC20A.abi, provider.getSigner());
    const contract_ERC20_A = new ethers.Contract(CONTRACT_ADDRESS_ERC20_A, contractERC20A.abi, provider.getSigner());


    const handleSubmit = async (event) => {
        event.preventDefault();

        const receiver = receiverRef.current.value
        let amount = amountRef.current.value
        const timelock = timelockRef.current.value
        if (amount == "") {
            amount = 0
        }

        const block = await provider.getBlockNumber()
        console.log(block)

        const result = await contract_ERC20_A.allowance(PUBLIC_KEYA, CONTRACT_ADDRESS_SWAP_ERC20_A)
        console.log(parseFloat(result._hex));
        if (parseFloat(result._hex) < amount && parseFloat(result._hex) > 0) {
            alert('increase allowance of this ERC20')
        } else {
            const pwd2 = "monmotdepasse"
            const bytes = ethers.utils.toUtf8Bytes(pwd2)
            const h2 = ethers.utils.sha256(bytes)
            console.log("sha256 of monmotdepasse : ", h2)

            const ID = ethers.utils.formatBytes32String("react1")
            console.log("string ID : ", ethers.utils.parseBytes32String(ID))
            console.log("ID is : ", ID)
            const tx = await window.ethereum.CONTRACT_ADDRESS_SWAP_ERC20_A.open(ID, 10, CONTRACT_ADDRESS_ERC20_A, PUBLIC_KEYB, h2, 40)
            console.log(tx)
        }

        const transactionParameters = {
            nonce: '0x00', // ignored by MetaMask
            gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
            gas: '0x2710', // customizable by user during MetaMask confirmation.
            to: '0x0000000000000000000000000000000000000000', // Required except during contract publications.
            from: window.ethereum.selectedAddress, // must match user's active address.
            value: '0x00', // Only required to send ether to the recipient from the initiating external account.
            data:
                '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
            chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
        };

        // txHash is a hex string
        // As with any RPC call, it may throw an error
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
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