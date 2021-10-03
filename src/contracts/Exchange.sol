// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;
import './Token.sol';

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	// token address => user address => actual number of tokens
	mapping(address => mapping(address => uint256)) public tokens;
	
	event Deposit(address token, address user, uint256 amount, uint256 balance);
	
	constructor(address _feeAccount, uint256 _feePercent) public {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	} 
	
	fallback() external  {
      revert();
  }
	
	function depositToken(address _token, uint256 _amount) public {
		// Token(_token) - instance of our token on the Etherium network
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		tokens[_token][msg.sender] = 	tokens[_token][msg.sender] + _amount;
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}
}