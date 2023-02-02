// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const TokenA = await hre.ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(100);
  await tokenA.deployed();
  console.log(
    `tokenA deployed to ${tokenA.address}`
  );

  const TokenB = await hre.ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy(200);
  await tokenB.deployed();
  console.log(
    `tokenB deployed to ${tokenB.address}`
  );
  const SwapERC20A = await hre.ethers.getContractFactory("AtomicSwapERC20A");
  const swapERC20A = await SwapERC20A.deploy();
  await swapERC20A.deployed();
  console.log(
    `swapERC20A deployed to ${swapERC20A.address}`
  );
  const SwapERC20B = await hre.ethers.getContractFactory("AtomicSwapERC20B");
  const swapERC20B = await SwapERC20B.deploy();
  await swapERC20B.deployed();
  console.log(
    `swapERC20B deployed to ${swapERC20B.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
