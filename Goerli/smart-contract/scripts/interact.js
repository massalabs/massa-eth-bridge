const API_KEY = process.env.API_KEY;
const PRIVATE_KEYA = process.env.PRIVATE_KEYA;
const PRIVATE_KEYB = process.env.PRIVATE_KEYB;
const PUBLIC_KEYA = process.env.PUBLIC_KEYA;
const PUBLIC_KEYB = process.env.PUBLIC_KEYB;
const CONTRACT_ADDRESS_SWAP_ERC20_A = process.env.CONTRACT_ADDRESS_SWAP_ERC20_A;
const CONTRACT_ADDRESS_SWAP_ERC20_B = process.env.CONTRACT_ADDRESS_SWAP_ERC20_B;
const CONTRACT_ADDRESS_ERC20_A = process.env.CONTRACT_ADDRESS_ERC20_A;
const CONTRACT_ADDRESS_ERC20_B = process.env.CONTRACT_ADDRESS_ERC20_B;
const {
  ethers
} = require("hardhat");
const swapERC20A = require("../artifacts/contracts/SwapERC20A.sol/AtomicSwapERC20A.json");
const swapERC20B = require("../artifacts/contracts/SwapERC20B.sol/AtomicSwapERC20B.json");
const contractERC20A = require("../artifacts/contracts/Token.sol/TokenA.json");
const contractERC20B = require("../artifacts/contracts/Token.sol/TokenB.json");

const provider = new ethers.providers.AlchemyProvider(network="goerli", API_KEY);
const signerA = new ethers.Wallet(PRIVATE_KEYA, provider);
const signerB = new ethers.Wallet(PRIVATE_KEYB, provider);

const SwapERC20Aa = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20_A, swapERC20A.abi, signerA);
const SwapERC20Ba = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20_B, swapERC20B.abi, signerA);
const ContractERC20Aa = new ethers.Contract(CONTRACT_ADDRESS_ERC20_A, contractERC20A.abi, signerA);
const ContractERC20Ba = new ethers.Contract(CONTRACT_ADDRESS_ERC20_B, contractERC20B.abi, signerA);


const SwapERC20Ab = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20_A, swapERC20A.abi, signerB);
const SwapERC20Bb = new ethers.Contract(CONTRACT_ADDRESS_SWAP_ERC20_B, swapERC20B.abi, signerB);
const ContractERC20Ab = new ethers.Contract(CONTRACT_ADDRESS_ERC20_A, contractERC20A.abi, signerB);
const ContractERC20Bb = new ethers.Contract(CONTRACT_ADDRESS_ERC20_B, contractERC20B.abi, signerB);


async function main() {

/*
    const increaseAllA = await ContractERC20Aa.increaseAllowance(CONTRACT_ADDRESS_SWAP_ERC20_A, 10)
    console.log("increase in SwapA : ", increaseAllA)
  
    const increaseAllB = await ContractERC20Bb.increaseAllowance(CONTRACT_ADDRESS_SWAP_ERC20_B, 20)
    console.log("increase in SwapA : ", increaseAllB)
*/
    const allA = await ContractERC20Aa.allowance(PUBLIC_KEYA, CONTRACT_ADDRESS_SWAP_ERC20_A)
    console.log("Allowance in SwapA with Token A : ", allA)

    const allB = await ContractERC20Bb.allowance(PUBLIC_KEYB, CONTRACT_ADDRESS_SWAP_ERC20_B)
    console.log("Allowance in SwapB with Token B : ", allB)
/*
    const pwd2 = "monmotdepasse"
    const bytes = ethers.utils.toUtf8Bytes(pwd2)
    const h2 = ethers.utils.sha256(bytes)
    console.log("sha256 of monmotdepasse : ", h2)

    const pwd3 = ""
    const bytes3 = ethers.utils.toUtf8Bytes(pwd3)
    const h3 = ethers.utils.sha256(bytes3)
    console.log("sha256 of RIEN : ", h3)

    const ID = ethers.utils.formatBytes32String("test2")
    console.log("string ID : ", ethers.utils.parseBytes32String(ID))
    console.log("ID is : ", ID)

    const openA = await SwapERC20Aa.open(ID, 10, CONTRACT_ADDRESS_ERC20_A, PUBLIC_KEYB, h2, 40)
    const openB = await SwapERC20Bb.open(ID, 20, CONTRACT_ADDRESS_ERC20_B, PUBLIC_KEYA, h2, 3)

    const stateOfIdA = await SwapERC20Aa.check(ID)
    console.log("state of", ID, " on contract A : ", stateOfIdA)

    const stateOfIdB = await SwapERC20Bb.check(ID)
    console.log("state of", ID, " on contract B : ", stateOfIdB)

    const closeIdInB = await SwapERC20Ba.close(ID, ethers.utils.toUtf8Bytes("monmotdepasse"))
    console.log("close event : " + closeIdInB)

    const closeIdInA = await SwapERC20Ab.close(ID, ethers.utils.toUtf8Bytes("monmotdepasse"))
    console.log("close event : " + closeIdInA)
*/


 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });