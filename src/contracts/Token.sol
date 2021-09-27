// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;

contract Token {
	string public name = 'EMG';
	string public symbol = 'EMG';
	uint256 public decimals = 18;
	uint256 public totalSupply;

	constructor() public {
		totalSupply = 100 * (10 * decimals);
	}
}
