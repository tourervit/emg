// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;

contract Token {
	string public name = 'EMG';
	string public symbol = 'EMG';
	uint public decimals = 18;
	uint public totalSupply;
	mapping(address => uint) public balanceOf;
	// address maps to exchange which maps to address and amount
	mapping(address => mapping(address => uint)) public allowance;

	event Transfer(address indexed from, address indexed to, uint value);
	event Approval(address indexed owner, address indexed spender, uint value);

	constructor() public {
		totalSupply = 100 * (10**decimals);
		balanceOf[msg.sender] = totalSupply;
	}
	
	function _transferWithEmit(address _from, address _to, uint _value) internal {
		balanceOf[_from] = balanceOf[_from] - _value;
		balanceOf[_to] = balanceOf[_to] + _value;
		emit Transfer(_from, _to, _value);
	}

	function transfer(address _to, uint _value) public returns (bool success) {
		require(balanceOf[msg.sender] >= _value);
		_transferWithEmit(msg.sender, _to, _value);
		return true;
	}
	
	function approve(address _spender, uint _value) public returns (bool success) {
		allowance[msg.sender][_spender] = _value;
		emit Approval(msg.sender, _spender, _value);
		return true;
	}
	
	function transferFrom(address _from, address _to, uint _value) public returns (bool success) {	
		require(_value <= balanceOf[_from]);	
		require(_value <= allowance[_from][msg.sender]);	
		_transferWithEmit(_from, _to, _value);
		allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;
		return true;		
	}
}
