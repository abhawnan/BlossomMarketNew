// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importing ERC721 with URI storage support for NFTs
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Importing Ownable contract to add access control (e.g., onlyOwner functions)
import "@openzeppelin/contracts/access/Ownable.sol";

// BlossomNFT contract inheriting from ERC721URIStorage and Ownable
contract BlossomNFT is ERC721URIStorage, Ownable {
    // Tracks the next token ID to mint
    uint256 public nextTokenId;

    // Constructor sets the NFT collection name and symbol,
    // and initializes the contract owner using Ownable(msg.sender)
    constructor() ERC721("BlossomNFT", "BLOOM") Ownable(msg.sender) {}

    /**
     * @notice Mints a new NFT to the sender's address with a given token URI
     * @param tokenURI A string pointing to metadata (e.g., on IPFS or a metadata server)
     */
    function mint(string memory tokenURI) public {
        uint256 tokenId = nextTokenId;

        // Mint the NFT safely to the caller's address
        _safeMint(msg.sender, tokenId);

        // Set the token URI for metadata (image, attributes, etc.)
        _setTokenURI(tokenId, tokenURI);

        // Increment the token ID counter
        nextTokenId++;
    }
}
