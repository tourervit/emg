// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;

contract Token {
	string public name = 'EMG';
	string public symbol = 'EMG';
	uint256 public decimals = 18;
	uint256 public totalSupply;

	mapping(address => uint256) public balanceOf;

	constructor() public {
		totalSupply = 100 * (10**decimals);
		balanceOf[msg.sender] = totalSupply;
	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		balanceOf[msg.sender] = balanceOf[msg.sender] - _value;
		balanceOf[_to] = balanceOf[_to] + _value;
		return true;
	}
}
