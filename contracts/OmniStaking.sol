// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/IOFTReceiverV2.sol";
import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/IOFTV2.sol";
import "./IERC20.sol";

contract OmniStaking is IOFTReceiverV2 {
    uint8 public constant STAKE_ACTION_ID = 0;
    uint64 public constant DST_GAS_FOR_CALL = 300000; // estimate gas usage of onOFTReceived()

    IOFTV2 public ost;
    mapping(address => uint256) public balances;
    mapping(uint16 => bytes32) public remoteStakingContracts;

    event Stake(address indexed user, uint amount);
    event SendAndStake(
        address indexed user,
        uint16 indexed destChainId,
        uint amount
    );
    event Unstake(address indexed user, uint amount);

    constructor(address _ostAddress) {
        ost = IOFTV2(_ostAddress);
    }

    function setRemoteStakingContract(
        uint16 _chainId,
        bytes32 _stakingContract
    ) external {
        remoteStakingContracts[_chainId] = _stakingContract;
    }

    function sendAndStake(
        uint16 _destChainId,
        uint256 _amount,
        bytes calldata _adapterParams
    ) external payable {
        bytes32 destinationStakingContract = remoteStakingContracts[
            _destChainId
        ];
        require(
            destinationStakingContract != bytes32(0),
            "Proxy: destination address not set"
        );

        IERC20(address(ost)).transferFrom(msg.sender, address(this), _amount);

        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(msg.sender), // refund address
            address(0), // zro payment address
            _adapterParams // adapter parameter
        );

        ost.sendAndCall{value: msg.value}(
            address(this),
            _destChainId, // destination chain id
            destinationStakingContract, // to address
            _amount, // amount
            abi.encode(msg.sender, STAKE_ACTION_ID), // payload
            DST_GAS_FOR_CALL, // dest gas for call
            callParams // LzCallParams
        );

        emit SendAndStake(msg.sender, _destChainId, _amount);
    }

    function stake(uint256 _amount) external {
        _stake(msg.sender, _amount);
    }

    function stakeOnBehalf(address _user, uint256 _amount) external {
        _stake(_user, _amount);
    }

    function unstake(uint256 _amount) external {
        _unstake(msg.sender, _amount);
    }

    function _stake(address _user, uint256 _amount) internal {
        balances[_user] += _amount;
        emit Stake(_user, _amount);
    }

    function _unstake(address _user, uint256 _amount) internal {
        balances[_user] -= _amount;
        emit Unstake(_user, _amount);
    }

    function onOFTReceived(
        uint16 _srcChainId,
        bytes calldata,
        uint64,
        bytes32 _from,
        uint _amount,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(ost), "Staking: only oft can call");
        require(
            _from == remoteStakingContracts[_srcChainId],
            "Staking: invalid from address"
        );

        (address user, uint8 actionId) = abi.decode(_payload, (address, uint8));

        if (actionId == 0) {
            _stake(user, _amount);
        } else if (actionId == 1) {
            _unstake(user, _amount);
        } else {
            revert("Staking: invalid action id");
        }
    }
}
