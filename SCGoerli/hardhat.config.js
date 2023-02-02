require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const { PRIVATE_KEYA, API_URL_goerli } = process.env;

module.exports = {
   solidity: "0.8.1",
   defaultNetwork: "goerli",
   networks: {
      goerli: {
         url: API_URL_goerli,
         accounts: [`0x${PRIVATE_KEYA}`]
      },
      goerli_perso: {
         url: "http://127.0.0.1:8545",
         accounts: [`0x${PRIVATE_KEYA}`]
      }
   },
}