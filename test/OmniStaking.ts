import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const DUMMY_CHAIN_ID_A = 1;
const DUMMY_CHAIN_ID_B = 2;

describe("OmniStaking", function () {
  async function deployOS(chainId: number = DUMMY_CHAIN_ID_A) {
    const [owner, otherAccount] = await ethers.getSigners();

    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const lzEndpointMock = await LZEndpointMock.deploy(chainId);

    const OST = await ethers.getContractFactory("OmniStakingToken");
    const ost = await OST.deploy(lzEndpointMock, 10);

    const OS = await ethers.getContractFactory("OmniStaking");
    const os = await OS.deploy(ost.getAddress());

    return { os, ost, lzEndpointMock, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy and get info from getters", async function () {
      const { os, ost } = await loadFixture(deployOS);
      expect(await os.ost()).to.equal(await ost.getAddress());
    });
  });

  describe("sendAndStake", function () {
    it("should stake from A to B chains", async function () {
      const AMOUNT_TO_SEND = ethers.parseEther("1000");
      const {
        os: osA,
        ost: ostA,
        lzEndpointMock: lzEndpointMockA,
        owner,
      } = await deployOS(DUMMY_CHAIN_ID_A);

      const {
        os: osB,
        ost: ostB,
        lzEndpointMock: lzEndpointMockB,
      } = await deployOS(DUMMY_CHAIN_ID_B);

      // mint to owner
      await ostA.mintTokens(owner, AMOUNT_TO_SEND);

      // convert addresses to bytes/bytes32
      const ostAAddress = ethers.zeroPadValue(await ostA.getAddress(), 20);
      const osAddress = ethers.zeroPadValue(await osA.getAddress(), 32);
      const ostBAddress = ethers.zeroPadValue(await ostB.getAddress(), 20);
      const osBAddress = ethers.zeroPadValue(await osB.getAddress(), 32);
      const adapterParams = "0x";

      // set up remote/trusted addresses
      await osA.setRemoteStakingContract(DUMMY_CHAIN_ID_B, osBAddress);
      await ostA.setTrustedRemoteAddress(DUMMY_CHAIN_ID_B, ostBAddress);
      await lzEndpointMockA.setDestLzEndpoint(
        await ostB.getAddress(),
        lzEndpointMockB.getAddress()
      );
      await osB.setRemoteStakingContract(DUMMY_CHAIN_ID_A, osAddress);
      await ostB.setTrustedRemoteAddress(DUMMY_CHAIN_ID_A, ostAAddress);

      // approving the tokens to send and stake
      await ostA.approve(osA.getAddress(), AMOUNT_TO_SEND);

      // sending and staking
      await osA.sendAndStake(
        DUMMY_CHAIN_ID_B,
        ethers.parseEther("1000"),
        adapterParams,
        { value: ethers.parseEther("1") }
      );

      expect(await ostA.balanceOf(owner.getAddress())).to.equal(
        ethers.parseEther("0")
      );

      expect(await ostB.balanceOf(osB.getAddress())).to.equal(
        ethers.parseEther("1000")
      );

      expect(await osB.balances(owner.getAddress())).to.equal(
        ethers.parseEther("1000")
      );
    });
  });
});
