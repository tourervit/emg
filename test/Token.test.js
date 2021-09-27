const Web3 = require('web3');
const Token = artifacts.require('./Token');

require('chai').use(require('chai-as-promised')).should();

contract('Token', accounts => {
	const web3 = new Web3();

	const deployer = accounts[0];
	const receiver = accounts[1];
	const name = 'EMG';
	const symbol = 'EMG';
	const decimals = 18 + '';
	const totalSupply = web3.utils.toWei('100', 'ether');

	let token;
	beforeEach(async () => {
		token = await Token.new();
	});

	describe('deployment', () => {
		it('tracks the name', async () => {
			const result = await token.name();
			result.should.equal(name);
		});

		it('tracks the symbol', async () => {
			const result = await token.symbol();
			result.should.equal(symbol);
		});

		it('tracks the decimals', async () => {
			const result = await token.decimals();
			result.toString().should.equal(decimals);
		});

		it('tracks the totalSupply', async () => {
			const result = await token.totalSupply();
			result.toString().should.equal(totalSupply);
		});

		it('assigns all the tokens to deployer', async () => {
			const result = await token.balanceOf(deployer);
			result.toString().should.equal(totalSupply);
		});
	});

	describe('sending tokens', () => {
		it('transfers token balances', async () => {
			const deployerBalanceBeforeTransfer = await token.balanceOf(deployer);
			console.log('deployerBalance: ', deployerBalanceBeforeTransfer.toString());
			const receiverBalanceBeforeTransfer = await token.balanceOf(receiver);
			console.log('receiverBalance: ', receiverBalanceBeforeTransfer.toString());

			await token.transfer(receiver, web3.utils.toWei('1', 'ether'), { from: deployer });

			const deployerBalanceAfterTransfer = await token.balanceOf(deployer);
			console.log('deployerBalance: ', deployerBalanceAfterTransfer.toString());
			const receiverBalanceAfterTransfer = await token.balanceOf(receiver);
			console.log('receiverBalance: ', receiverBalanceAfterTransfer.toString());
		});
	});
});
