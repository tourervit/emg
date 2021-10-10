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
	mapping(uint256 => _Order) public orders;
	mapping(uint256 => bool) public canceledOrders;
	mapping(uint256 => bool) public filledOrders;
	uint256 public orderCount;

	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address token, address user, uint256 amount, uint256 balance);
	event Order(
		uint256 id,
		address user,
		address tokenBuy,
		uint256 amountBuy,
		address tokenSell,
		uint256 amountSell,
		uint256 timestamp
	);
	event CancelOrder(
		uint256 id,
		address user,
		address tokenBuy,
		uint256 amountBuy,
		address tokenSell,
		uint256 amountSell,
		uint256 timestamp
	);
	event Trade(
		uint256 id,
		address user,
		address tokenBuy,
		uint256 amountBuy,
		address tokenSell,
		uint256 amountSell,
		address userFill,
		uint256 timestamp
	);

	struct _Order {
		uint256 id;
		address user; // who created an order
		address tokenBuy; // tokens that creator want to purchase
		uint256 amountBuy; // amount of that tokens
		address tokenSell; // tokens that creator want to use
		uint256 amountSell; // amount of that tokens
		uint256 timestamp;
	}

	constructor(address _feeAccount, uint256 _feePercent) public {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	fallback() external {
		revert();
	}

	function depositEther() public payable {
		tokens[ETH_ADDRESS][msg.sender] = tokens[ETH_ADDRESS][msg.sender] + msg.value;
		emit Deposit(ETH_ADDRESS, msg.sender, msg.value, tokens[ETH_ADDRESS][msg.sender]);
	}

	function withdrawEther(uint256 _amount) public {
		require(tokens[ETH_ADDRESS][msg.sender] >= _amount);
		tokens[ETH_ADDRESS][msg.sender] = tokens[ETH_ADDRESS][msg.sender] - _amount;
		payable(msg.sender).transfer(_amount);
		emit Withdraw(ETH_ADDRESS, msg.sender, _amount, tokens[ETH_ADDRESS][msg.sender]);
	}

	function depositToken(address _token, uint256 _amount) public {
		require(_token != ETH_ADDRESS);
		// Token(_token) - instance of our token on the Etherium network
		// this - this Exchange SC
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function withdrawToken(address _token, uint256 _amount) public {
		require(_token != ETH_ADDRESS);
		require(tokens[_token][msg.sender] >= _amount);
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
		require(Token(_token).transfer(msg.sender, _amount));
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function balanceOf(address _token, address _user) public view returns (uint256) {
		return tokens[_token][_user];
	}

	function makeOrder(
		address _tokenBuy,
		uint256 _amountBuy,
		address _tokenSell,
		uint256 _amountSell
	) public {
		orderCount = orderCount + 1;
		orders[orderCount] = _Order(
			orderCount,
			msg.sender,
			_tokenBuy,
			_amountBuy,
			_tokenSell,
			_amountSell,
			block.timestamp
		);
		emit Order(
			orderCount,
			msg.sender,
			_tokenBuy,
			_amountBuy,
			_tokenSell,
			_amountSell,
			block.timestamp
		);
	}

	function cancelOrder(uint256 _id) public {
		_Order memory _order = orders[_id];
		require(address(_order.user) == msg.sender);
		require(_order.id == _id);
		canceledOrders[_id] = true;
		emit CancelOrder(
			orderCount,
			msg.sender,
			_order.tokenBuy,
			_order.amountBuy,
			_order.tokenSell,
			_order.amountSell,
			block.timestamp
		);
	}

	function fillOrder(uint256 _id) public {
		require(_id > 0 && _id <= orderCount);
		require(!filledOrders[_id]);
		require(!canceledOrders[_id]);
		_Order memory _order = orders[_id];
		_trade(
			_order.id,
			_order.user,
			_order.tokenBuy,
			_order.amountBuy,
			_order.tokenSell,
			_order.amountSell
		);
		filledOrders[_order.id] = true;
	}

	function _trade(
		uint256 _orderId,
		address _user,
		address _tokenBuy,
		uint256 _amountBuy,
		address _tokenSell,
		uint256 _amountSell
	) internal {
		// _user is the person who created an order
		// msg.sender == initiator, the person who fills the order, also is the one who pays the fee
		uint256 _feeAmount = (_amountSell * feePercent) / 100;

		// e.g. order is from creator perspective
		// _user wants eth, so tokenBuy is eth, tokenSell is emg
		tokens[_tokenBuy][msg.sender] = tokens[_tokenBuy][msg.sender] - (_amountBuy + _feeAmount);
		tokens[_tokenBuy][_user] = tokens[_tokenBuy][_user] + _amountBuy;
		tokens[_tokenBuy][feeAccount] = tokens[_tokenBuy][feeAccount] + _feeAmount;
		tokens[_tokenSell][_user] = tokens[_tokenSell][_user] - _amountSell;
		tokens[_tokenSell][msg.sender] = tokens[_tokenSell][msg.sender] + _amountSell;

		emit Trade(
			_orderId,
			_user,
			_tokenBuy,
			_amountBuy,
			_tokenSell,
			_amountSell,
			msg.sender,
			block.timestamp
		);
	}
}
