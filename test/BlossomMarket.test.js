const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlossomMarket", function () {
  let BlossomNFT;
  let blossomNFT;
  let BlossomMarket;
  let blossomMarket;
  let owner;
  let seller;
  let buyer;
  let addr3;
  const tokenURI = "ipfs://some-hash";

  beforeEach(async function () {
    [owner, seller, buyer, addr3] = await ethers.getSigners();

    BlossomNFT = await ethers.getContractFactory("BlossomNFT");
    blossomNFT = await BlossomNFT.deploy();
    await blossomNFT.waitForDeployment();

    BlossomMarket = await ethers.getContractFactory("BlossomMarket");
    blossomMarket = await BlossomMarket.deploy();
    await blossomMarket.waitForDeployment();

    // Mint an NFT for the seller
    await blossomNFT.connect(seller).mint(tokenURI);
  });

  it("Should deploy successfully", async function () {
    expect(await blossomMarket.listings.length).to.equal(0);
  });

  it("Should allow a user to list their NFT for sale", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1.0");

    // Approve the market to transfer the NFT
    await blossomNFT.connect(seller).approve(blossomMarket.target, tokenId);

    await expect(blossomMarket.connect(seller).listNFT(blossomNFT.target, tokenId, price))
      .to.emit(blossomMarket, "Listed")
      .withArgs(0, seller.address, tokenId, price);

    const listing = await blossomMarket.listings(0);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.tokenAddress).to.equal(blossomNFT.target);
    expect(listing.tokenId).to.equal(tokenId);
    expect(listing.price).to.equal(price);
    expect(listing.sold).to.equal(false);
  });

  it("Should not allow a user to list an NFT they don't own", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1.0");

    await expect(blossomMarket.connect(buyer).listNFT(blossomNFT.target, tokenId, price))
      .to.be.revertedWith("Not NFT owner");
  });

  it("Should allow a user to buy a listed NFT", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1.0");

    // Approve the market to transfer the NFT
    await blossomNFT.connect(seller).approve(blossomMarket.target, tokenId);
    await blossomMarket.connect(seller).listNFT(blossomNFT.target, tokenId, price);

    const initialSellerBalance = await ethers.provider.getBalance(seller.address);

    await expect(blossomMarket.connect(buyer).buyNFT(0, { value: price }))
      .to.emit(blossomMarket, "Bought")
      .withArgs(0, buyer.address, tokenId, price);

    const finalSellerBalance = await ethers.provider.getBalance(seller.address);
    expect(finalSellerBalance).to.be.gt(initialSellerBalance); // Check that seller received funds

    expect(await blossomNFT.ownerOf(tokenId)).to.equal(buyer.address); // Check ownership transferred
    const listing = await blossomMarket.listings(0);
    expect(listing.sold).to.equal(true);
  });

  it("Should not allow a user to buy an NFT with insufficient funds", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1.0");
    const insufficientFunds = ethers.parseEther("0.5");

    // Approve the market to transfer the NFT
    await blossomNFT.connect(seller).approve(blossomMarket.target, tokenId);
    await blossomMarket.connect(seller).listNFT(blossomNFT.target, tokenId, price);

    await expect(blossomMarket.connect(buyer).buyNFT(0, { value: insufficientFunds }))
      .to.be.revertedWith("Not enough ETH");
  });

  it("Should not allow a user to buy an already sold NFT", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1.0");

    // Approve the market to transfer the NFT
    await blossomNFT.connect(seller).approve(blossomMarket.target, tokenId);
    await blossomMarket.connect(seller).listNFT(blossomNFT.target, tokenId, price);
    await blossomMarket.connect(buyer).buyNFT(0, { value: price });

    await expect(blossomMarket.connect(addr3).buyNFT(0, { value: price }))
      .to.be.revertedWith("Already sold");
  });

  it("Should return all listings", async function () {
    const price1 = ethers.parseEther("1.0");
    const price2 = ethers.parseEther("2.0");

    // Mint a second NFT for the seller
    await blossomNFT.connect(seller).mint(tokenURI);

    // Approve market for both NFTs
    await blossomNFT.connect(seller).approve(blossomMarket.target, 0);
    await blossomNFT.connect(seller).approve(blossomMarket.target, 1);

    await blossomMarket.connect(seller).listNFT(blossomNFT.target, 0, price1);
    await blossomMarket.connect(seller).listNFT(blossomNFT.target, 1, price2);

    const allListings = await blossomMarket.getAllListings();
    expect(allListings.length).to.equal(2);
    expect(allListings[0].seller).to.equal(seller.address);
    expect(allListings[0].tokenId).to.equal(0);
    expect(allListings[0].price).to.equal(price1);
    expect(allListings[1].seller).to.equal(seller.address);
    expect(allListings[1].tokenId).to.equal(1);
    expect(allListings[1].price).to.equal(price2);
  });
});