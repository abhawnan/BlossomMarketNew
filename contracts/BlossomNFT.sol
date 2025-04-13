// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlossomNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("BlossomNFT", "BLOOM") Ownable(msg.sender) {} 

    function mint(string memory tokenURI) public {
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        nextTokenId++;
    }
}
