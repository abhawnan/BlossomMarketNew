const { expect } = require("chai");

describe("BlossomNFT and BlossomMarket", function () {
  let owner, alice, bob;
  let BlossomNFT, BlossomMarket;
  let nft, market;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy BlossomNFT
    const NFTFactory = await ethers.getContractFactory("BlossomNFT");
    nft = await NFTFactory.connect(owner).deploy();
    await nft.deployed();

    // Deploy BlossomMarket
    const MarketFactory = await ethers.getContractFactory("BlossomMarket");
    market = await MarketFactory.connect(owner).deploy();
    await market.deployed();
  });

  it("should mint an NFT", async function () {
    const tokenURI = "ipfs://exampleURI";
    await nft.connect(alice).mint(tokenURI);

    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.tokenURI(0)).to.equal(tokenURI);
  });

  it("should list and buy an NFT", async function () {
    const tokenURI = "ipfs://exampleNFT";
    await nft.connect(alice).mint(tokenURI);
    await nft.connect(alice).approve(market.address, 0);

    const price = ethers.utils.parseEther("1");
    await market.connect(alice).listNFT(nft.address, 0, price);

    const listings = await market.getAllListings();
    expect(listings.length).to.equal(1);
    expect(listings[0].seller).to.equal(alice.address);

    await expect(() =>
      market.connect(bob).buyNFT(0, { value: price })
    ).to.changeEtherBalance(alice, price);

    expect(await nft.ownerOf(0)).to.equal(bob.address);

    const updatedListing = await market.getAllListings();
    expect(updatedListing[0].sold).to.be.true;
  });

  it("should not let non-owner list NFT", async function () {
    await nft.connect(alice).mint("ipfs://badlist");
    await expect(
      market.connect(bob).listNFT(nft.address, 0, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("Not NFT owner");
  });

  it("should not allow buying sold NFT", async function () {
    await nft.connect(alice).mint("ipfs://once");
    await nft.connect(alice).approve(market.address, 0);
    await market.connect(alice).listNFT(nft.address, 0, ethers.utils.parseEther("1"));

    await market.connect(bob).buyNFT(0, { value: ethers.utils.parseEther("1") });

    await expect(
      market.connect(bob).buyNFT(0, { value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Already sold");
  });

  it("should not allow buying with insufficient funds", async function () {
    await nft.connect(alice).mint("ipfs://cheap");
    await nft.connect(alice).approve(market.address, 0);
    await market.connect(alice).listNFT(nft.address, 0, ethers.utils.parseEther("1"));

    await expect(
      market.connect(bob).buyNFT(0, { value: ethers.utils.parseEther("0.5") })
    ).to.be.revertedWith("Not enough ETH");
  });
});
