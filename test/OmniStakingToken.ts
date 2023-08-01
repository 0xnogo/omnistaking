import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OmniStakingtoken", function () {
  async function deployOST() {
    const [owner, otherAccount] = await ethers.getSigners();

    const { chainId } = await ethers.provider.getNetwork();

    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const lzEndpointMock = await LZEndpointMock.deploy(chainId);

    const OST = await ethers.getContractFactory("OmniStakingToken");
    const ost = await OST.deploy(lzEndpointMock, 10);

    return { ost, lzEndpointMock, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should get all the information from getters", async function () {
      const { ost } = await loadFixture(deployOST);
      expect(await ost.decimals()).to.equal(18);
      expect(await ost.name()).to.equal("OmniStakingToken");
      expect(await ost.symbol()).to.equal("OST");
      expect(await ost.token()).to.equal(await ost.getAddress());
    });

    it("should mints", async function () {
      const { ost, owner } = await loadFixture(deployOST);

      await ost.mintTokens(owner, ethers.parseEther("1000"));

      expect(await ost.balanceOf(owner.getAddress())).to.equal(
        ethers.parseEther("1000")
      );
    });
  });
});
