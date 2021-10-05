// SPDX-License-Identifier: MIT

// tell truffle what version of solidity we're using
pragma solidity >=0.4.22 <0.9.0;
import './Token.sol';

contract Exchange {
	address public feeAccount;
	uint public feePercent;
	// store ether on zero-address like ether token
	address constant ETH_ADDRESS = address(0);
	// token address => user address => actual number of tokens
	mapping(address => mapping(address => uint)) public tokens; 
	mapping(uint => _Order) public orders;
	mapping(uint => bool) public canceledOrders;
	uint public orderCount;
	
	event Deposit(address token, address user, uint amount, uint balance);
	event Withdraw(address token, address user, uint amount, uint balance);
	event Order(
		uint id,
		address user,
		address tokenBuy,
		uint amountBuy,
		address tokenSell,
		uint amountSell,
		uint timestamp
	);
	event CancelOrder(
		uint id,
		address user,
		address tokenBuy,
		uint amountBuy,
		address tokenSell,
		uint amountSell,
		uint timestamp
	);
	
	struct _Order {
		uint id;
		address user;
		address tokenBuy;
		uint amountBuy;
		address tokenSell;
		uint amountSell;
		uint timestamp;
	}
	
	constructor(address _feeAccount, uint _feePercent) public {
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
	
	function withdrawEther(uint _amount)  public {
		require(tokens[ETH_ADDRESS][msg.sender] >= _amount);
		tokens[ETH_ADDRESS][msg.sender] = tokens[ETH_ADDRESS][msg.sender] - _amount;
		payable(msg.sender).transfer(_amount);
		emit Withdraw(ETH_ADDRESS, msg.sender, _amount, tokens[ETH_ADDRESS][msg.sender]);
	}
	
	function depositToken(address _token, uint _amount) public {
		require(_token != ETH_ADDRESS);
		// Token(_token) - instance of our token on the Etherium network
		// this - this Exchange SC
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		tokens[_token][msg.sender] = 	tokens[_token][msg.sender] + _amount;
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}
	
	function withdrawToken(address _token, uint _amount) public {
		require(_token != ETH_ADDRESS);
    require(tokens[_token][msg.sender] >= _amount);
    tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
    require(Token(_token).transfer(msg.sender, _amount));
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}
	
	function balanceOf(address _token, address _user) public view returns(uint) {
		return tokens[_token][_user];
	}
	
	function makeOrder(address _tokenBuy, uint _amountBuy, address _tokenSell, uint _amountSell) public {
		orderCount = orderCount + 1;
		orders[orderCount] = _Order(orderCount, msg.sender, _tokenBuy, _amountBuy, _tokenSell, _amountSell, block.timestamp);
		emit Order(orderCount, msg.sender, _tokenBuy, _amountBuy, _tokenSell, _amountSell, block.timestamp);
	}
	
	function cancelOrder(uint _id) public {
		_Order memory _order = orders[_id];
		require(address(_order.user) == msg.sender);
		require(_order.id == _id);
		canceledOrders[_id] = true;
		emit CancelOrder(orderCount, msg.sender, _order.tokenBuy, _order.amountBuy, _order.tokenSell, _order.amountSell, block.timestamp);
	}
		
}