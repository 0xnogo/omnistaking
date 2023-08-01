// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";
import "@layerzerolabs/solidity-examples/contracts/mocks/LZEndpointMock.sol";

contract OmniStakingToken is OFTV2 {
    constructor(
        address _lzEndpoint,
        uint8 _sharedDecimals
    ) OFTV2("OmniStakingToken", "OST", _sharedDecimals, _lzEndpoint) {}

    function mintTokens(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
