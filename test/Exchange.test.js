const Web3 = require('web3');
const Token = artifacts.require('./Token');
const Exchange = artifacts.require('./Exchange');

const web3 = new Web3();
require('chai').use(require('chai-as-promised')).should();

contract('Exchange', accounts => {
	const [deployer, feeAccount, user1] = accounts;
	const feePercent = 10;
	let token;
	let exchange;

	beforeEach(async () => {
		token = await Token.new();
		token.transfer(user1, web3.utils.toWei('10', 'ether'), { from: deployer });
		exchange = await Exchange.new(feeAccount, feePercent);
	});

	describe('deployment', () => {
		it('tracks the fee account', async () => {
			const result = await exchange.feeAccount();
			result.should.equal(feeAccount);
		});

		it('tracks the fee percent', async () => {
			const result = await exchange.feePercent();
			result.toString().should.equal(feePercent.toString());
		});
	});

	describe('fallback', () => {
		it('reverts when eth is sent', async () => {
			await exchange
				.sendTransaction({ value: 1, from: user1 })
				.should.be.rejectedWith('VM Exception while processing transaction: revert');
		});
	});

	describe('depositing tokens', () => {
		let result;
		const amount = web3.utils.toWei('10', 'ether');

		describe('success', () => {
			beforeEach(async () => {
				await token.approve(exchange.address, amount, { from: user1 });
				result = await exchange.depositToken(token.address, amount, {
					from: user1,
				});
			});

			it('tracks the token deposit', async () => {
				let balance;
				// exchange token balance
				balance = await token.balanceOf(exchange.address);
				balance.toString().should.equal(amount.toString());
				// tokens on exchange
				balance = await exchange.tokens(token.address, user1);
				balance.toString().should.equal(amount.toString());
			});

			it('emits Deposit event', () => {
				const log = result.logs[0];
				log.event.should.equal('Deposit');
				const event = log.args;
				event.token.should.equal(token.address, 'token address is correct');
				event.user.should.equal(user1, 'user address is corrent');
				event.amount.toString().should.equal(amount, 'amount is correct');
				event.balance.toString().should.equal(amount, 'balance is correct');
			});
		});

		describe('failure', () => {
			it('rejects eth deposits', async () => {});
			it('fails when no tokens approved', async () => {
				await exchange
					.depositToken(token.address, amount, {
						from: user1,
					})
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});
});
