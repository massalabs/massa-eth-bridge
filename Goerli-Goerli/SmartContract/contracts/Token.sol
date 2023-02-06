// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20 {
    constructor(uint256 initialSupply) ERC20("WMassa", "WM") {
        _mint(0x3070E5CF67A17648ca5Bb78117b8361Dc40C973d, initialSupply*10**18);
    }
}

contract TokenB is ERC20 {
    constructor(uint256 initialSupply) ERC20("Massa", "M") {
        _mint(0x26493A0aF43D025Be865C65cae9Bc4856589C32f, initialSupply*10**18);
    }
}