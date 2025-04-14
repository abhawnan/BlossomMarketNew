const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlossomNFT", function () {
  let BlossomNFT;
  let blossomNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    BlossomNFT = await ethers.getContractFactory("BlossomNFT");
    blossomNFT = await BlossomNFT.deploy();
    await blossomNFT.waitForDeployment();
    
  });

  it("Should deploy successfully", async function () {
    expect(await blossomNFT.name()).to.equal("BlossomNFT");
    expect(await blossomNFT.symbol()).to.equal("BLOOM");
  });

  it("Should mint a new NFT", async function () {
    const tokenURI = "ipfs://some-hash";
    await blossomNFT.mint(tokenURI);
    expect(await blossomNFT.ownerOf(0)).to.equal(owner.address);
    expect(await blossomNFT.tokenURI(0)).to.equal(tokenURI);
    expect(await blossomNFT.nextTokenId()).to.equal(1);
  });

  it("Should increment nextTokenId for each minted NFT", async function () {
    await blossomNFT.mint("ipfs://hash1");
    await blossomNFT.mint("ipfs://hash2");
    expect(await blossomNFT.nextTokenId()).to.equal(2);
  });

  it("Should set the correct token URI", async function () {
    const tokenURI = "https://example.com/metadata/1";
    await blossomNFT.mint(tokenURI);
    expect(await blossomNFT.tokenURI(0)).to.equal(tokenURI);
  });
});