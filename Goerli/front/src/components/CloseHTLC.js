import React from 'react';
import { ethers } from "ethers";
import { providers } from "ethers";
import './CloseHTLC.css';

import { CONTRACT_ADDRESS_SWAP_ERC20 } from '../constant'

const CloseHTLC = () => {

    const secretKeyRef = React.useRef();
    const swapIDRef = React.useRef();

    const swapERC20 = require("../contracts/SwapERC20A.sol/AtomicSwapERC20A.json");

    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    const contract_SWAP_ERC20 = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20, swapERC20.abi, signer);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const secretKey = secretKeyRef.current.value
        const swapID = swapIDRef.current.value

        const secretKeyInBytes = ethers.utils.toUtf8Bytes(secretKey)
        const ID = ethers.utils.formatBytes32String(swapID)

        const swapWithSigner = contract_SWAP_ERC20.connect(signer)
        const closeHTLC = swapWithSigner.close(ID, secretKeyInBytes)
    };

    return (
        <div className="CloseHTLC">
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="swapID">SwapID</label>
                    <input id="swapID" type="text" ref={swapIDRef} />
                </div>
                <div>
                    <label htmlFor="secretKey">SecretKey</label>
                    <input id="secretKey" type="text" ref={secretKeyRef} />
                </div>
                <button type="submit">Close</button>
            </form>
        </div>
    )
}
export default CloseHTLC;