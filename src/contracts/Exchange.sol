// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;
import './Token.sol';

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	// store ether on zero-address like ether token
	address constant ETH_ADDRESS = address(0);
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
	
	function depositEther() payable public {
		tokens[ETH_ADDRESS][msg.sender] = tokens[ETH_ADDRESS][msg.sender] + msg.value;
		emit Deposit(ETH_ADDRESS, msg.sender, msg.value, tokens[ETH_ADDRESS][msg.sender]);
	}
	
	function depositToken(address _token, uint256 _amount) public {
		require(_token != ETH_ADDRESS);
		// Token(_token) - instance of our token on the Etherium network
		// this - this Exchange SC
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		tokens[_token][msg.sender] = 	tokens[_token][msg.sender] + _amount;
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}
}