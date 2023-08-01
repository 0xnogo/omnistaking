import { ethers } from "hardhat";

async function main() {
  const lzEndpoint = ""; // TODO: set this to the address of the LZEndpoint contract
  const ost = await ethers.deployContract("OmniStakingToken", [lzEndpoint, 10]);

  await ost.waitForDeployment();

  const os = await ethers.deployContract("OmniStaking", [ost.target]);

  await os.waitForDeployment();

  console.log(
    "OmniStakingToken deployed to:",
    ost.target,
    "and OmniStaking deployed to:",
    os.target
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
