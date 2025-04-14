// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// interface for interacting with Blossom NFT contracts
interface IBlossomNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract BlossomMarket {
    // struct to store NFT listing details
    struct Listing {
        address seller;
        address tokenAddress;
        uint256 tokenId;
        uint256 price;
        bool sold;
    }

    // array to store all listings
    Listing[] public listings;

    // events for frontends or off chain apps to track listing and purchase actions
    event Listed(uint indexed listingId, address seller, uint256 tokenId, uint256 price);
    event Bought(uint indexed listingId, address buyer, uint256 tokenId, uint256 price);

    // Staking data
    mapping(address => uint256) public stakedBalance;
    event Staked(address indexed user, uint256 amount);

    // Voting data
    mapping(address => bool) public hasVoted;
    mapping(string => uint256) public votes; // e.g., votes["add-auction"]

    event Voted(address indexed voter, string proposal);

    // Users can stake ETH into the marketplace
    function stake() external payable {
        require(msg.value > 0, "Must send ETH to stake");
        stakedBalance[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    // Simple one-time vote system
    function vote(string memory proposal) public {
        require(!hasVoted[msg.sender], "Already voted");
        hasVoted[msg.sender] = true;
        votes[proposal]++;
        emit Voted(msg.sender, proposal);
    }

    // allow NFT owners to list their NFT for sale
    function listNFT(address tokenAddress, uint256 tokenId, uint256 price) public {
        IBlossomNFT nft = IBlossomNFT(tokenAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        listings.push(Listing({
            seller: msg.sender,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            price: price,
            sold: false
        }));

        emit Listed(listings.length - 1, msg.sender, tokenId, price);
    }

    // allow users to buy a listed NFT by sending enough ETH
    function buyNFT(uint listingId) public payable {
        Listing storage listing = listings[listingId];
        require(!listing.sold, "Already sold");
        require(msg.value >= listing.price, "Not enough ETH");

        listing.sold = true;

        // Transfer NFT to buyer
        IBlossomNFT(listing.tokenAddress).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Transfer funds to seller
        payable(listing.seller).transfer(listing.price);
        emit Bought(listingId, msg.sender, listing.tokenId, listing.price);
    }

    // return all listings, including sol onesgit
    function getAllListings() public view returns (Listing[] memory) {
        return listings;
    }
}

