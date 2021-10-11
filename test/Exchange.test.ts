const E_Token = artifacts.require('./Token');
const E_Exchange = artifacts.require('./Exchange');

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
require('chai').use(require('chai-as-promised')).should();

contract('Exchange', accounts => {
	const [deployer, feeAccount, user1, user2] = accounts;
	const feePercent = 10;
	let token;
	let exchange;

	beforeEach(async () => {
		token = await E_Token.new();
		token.transfer(user1, web3.utils.toWei('1', 'ether'), { from: deployer });
		exchange = await E_Exchange.new(feeAccount, feePercent);
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

	describe('depositing ether', () => {
		let result;
		const amount = web3.utils.toWei('1', 'ether');
		beforeEach(async () => {
			result = await exchange.depositEther({ from: user1, value: amount });
		});

		it('tracks eth deposit', async () => {
			const balance = await exchange.tokens(ETH_ADDRESS, user1);
			balance.toString().should.be.equal(amount.toString());
		});

		it('emits Deposit event', () => {
			const log = result.logs[0];
			log.event.should.equal('Deposit');
			const event = log.args;
			event.token.should.equal(ETH_ADDRESS, 'ether address is correct');
			event.user.should.equal(user1, 'user address is corrent');
			event.amount.toString().should.equal(amount, 'amount is correct');
			event.balance.toString().should.equal(amount, 'balance is correct');
		});
	});

	describe('withdrawing ether', () => {
		let result;
		const amount = web3.utils.toWei('1', 'ether');

		describe('success', async () => {
			beforeEach(async () => {
				await exchange.depositEther({ from: user1, value: amount });
			});

			it('withdraws ether', async () => {
				result = await exchange.withdrawEther(amount, { from: user1 });
				const balance = await exchange.tokens(ETH_ADDRESS, user1);
				balance.toString().should.equal('0');
			});

			it('emits Withdraw event', () => {
				const log = result.logs[0];
				log.event.should.equal('Withdraw');
				const event = log.args;
				event.token.should.equal(ETH_ADDRESS, 'ether address is correct');
				event.user.should.equal(user1, 'user address is corrent');
				event.amount.toString().should.equal(amount, 'amount is correct');
				event.balance.toString().should.equal('0', 'balance is correct');
			});
		});

		describe('failure', async () => {
			it('rejects withdraws for insufficient balances', async () => {
				await exchange
					.withdrawEther(web3.utils.toWei('1000', 'ether'), { from: user1 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});

	describe('depositing tokens', () => {
		let result;
		let amount;

		describe('success', async () => {
			beforeEach(async () => {
				amount = web3.utils.toWei('1', 'ether');
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
			it('rejects eth deposits', async () => {
				await exchange
					.depositToken(ETH_ADDRESS, web3.utils.toWei('10', 'ether'), { from: user1 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
			it('fails when no tokens approved', async () => {
				await exchange
					.depositToken(token.address, amount, {
						from: user1,
					})
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});

	describe('withdrawing tokens', async () => {
		let result;
		const amount = web3.utils.toWei('1', 'ether');

		describe('success', () => {
			beforeEach(async () => {
				await token.approve(exchange.address, amount, { from: user1 });
				await exchange.depositToken(token.address, amount, { from: user1 });
				result = await exchange.withdrawToken(token.address, amount, { from: user1 });
			});

			it('withdraws tokens', async () => {
				const balance = await exchange.tokens(token.address, user1);
				balance.toString().should.equal('0');
			});

			it('emits Withdraw event', () => {
				const log = result.logs[0];
				log.event.should.eq('Withdraw');
				const event = log.args;
				event.token.should.equal(token.address);
				event.user.should.equal(user1);
				event.amount.toString().should.equal(amount.toString());
				event.balance.toString().should.equal('0');
			});
		});

		describe('failure', async () => {
			it('rejects ether withdraw', async () => {
				await exchange
					.withdrawToken(ETH_ADDRESS, web3.utils.toWei('1', 'ether'), { from: user1 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});

			it('fails for insufficient balances', async () => {
				await exchange
					.withdrawToken(token.address, web3.utils.toWei('100', 'ether'), { from: user1 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});

	describe('check user balance', async () => {
		beforeEach(async () => {
			await exchange.depositEther({ from: user1, value: web3.utils.toWei('1', 'ether') });
		});

		it('correctly reads user balance', async () => {
			const result = await exchange.balanceOf(ETH_ADDRESS, user1);
			result.toString().should.equal(web3.utils.toWei('1', 'ether'));
		});
	});

	describe('order init', async () => {
		let result;
		beforeEach(async () => {
			result = await exchange.makeOrder(
				token.address,
				web3.utils.toWei('1', 'ether'),
				ETH_ADDRESS,
				web3.utils.toWei('1', 'ether'),
				{ from: user1 },
			);
		});

		it('tracks the new order', async () => {
			const orderCount = await exchange.orderCount();
			orderCount.toString().should.eq('1');
			const order = await exchange.orders('1');
			order.id.toString().should.eq('1', 'id is correct');
			order.tokenBuy.should.eq(token.address, 'tokenBuy is correct');
			order.amountBuy.toString().should.eq(web3.utils.toWei('1', 'ether'), 'amountBuy is correct');
			order.tokenSell.should.eq(ETH_ADDRESS, 'tokenSell is correct');
			order.amountSell
				.toString()
				.should.eq(web3.utils.toWei('1', 'ether'), 'amountSell is correct');
			order.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct');
		});

		it('emits Order event', () => {
			const log = result.logs[0];
			log.event.should.eq('Order');
			const event = log.args;
			event.id.toString().should.eq('1', 'id is correct');
			event.user.should.eq(user1, 'user address is corrent');
			event.tokenBuy.should.eq(token.address, 'tokenBuy is correct');
			event.amountBuy.toString().should.eq(web3.utils.toWei('1', 'ether'), 'amountBuy is correct');
			event.tokenSell.should.eq(ETH_ADDRESS, 'tokenSell is correct');
			event.amountSell
				.toString()
				.should.eq(web3.utils.toWei('1', 'ether'), 'amountSell is correct');
			event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct');
		});
	});

	describe('orders', async () => {
		beforeEach(async () => {
			await exchange.depositEther({ from: user1, value: web3.utils.toWei('1', 'ether') });
			await token.transfer(user2, web3.utils.toWei('10', 'ether'), { from: deployer });
			await token.approve(exchange.address, web3.utils.toWei('2', 'ether'), { from: user2 });
			await exchange.depositToken(token.address, web3.utils.toWei('2', 'ether'), { from: user2 });
			await exchange.makeOrder(
				token.address,
				web3.utils.toWei('1', 'ether'),
				ETH_ADDRESS,
				web3.utils.toWei('1', 'ether'),
				{ from: user1 },
			);
		});

		describe('filling orders', async () => {
			let result;
			describe('success', async () => {
				beforeEach(async () => {
					result = await exchange.fillOrder('1', { from: user2 });
				});

				it('excecutes trade and charges fee', async () => {
					let balance;
					balance = await exchange.balanceOf(token.address, user1);
					balance.toString().should.eq(web3.utils.toWei('1', 'ether'), 'user1 received tokens');
					balance = await exchange.balanceOf(ETH_ADDRESS, user2);
					balance.toString().should.eq(web3.utils.toWei('1', 'ether'), 'user2 received eth');
					balance = await exchange.balanceOf(ETH_ADDRESS, user1);
					balance.toString().should.eq('0', 'user1 has no eth');
					balance = await exchange.balanceOf(token.address, user2);
					balance
						.toString()
						.should.eq(web3.utils.toWei('0.9', 'ether'), 'user2 tokens with fee applied');
					const feeAccount = await exchange.feeAccount();
					balance = await exchange.balanceOf(token.address, feeAccount);
					balance.toString().should.eq(web3.utils.toWei('0.1', 'ether'), 'feeAccount received fee');
				});

				it('updates filled orders', async () => {
					const filledOrder = await exchange.filledOrders(1);
					filledOrder.should.eq(true);
				});

				it('emits Trade event', () => {
					const log = result.logs[0];
					log.event.should.eq('Trade');
					const event = log.args;
					event.id.toString().should.eq('1', 'id is correct');
					event.user.should.eq(user1, 'user address is corrent');
					event.tokenBuy.should.eq(token.address, 'tokenBuy is correct');
					event.amountBuy
						.toString()
						.should.eq(web3.utils.toWei('1', 'ether'), 'amountBuy is correct');
					event.tokenSell.should.eq(ETH_ADDRESS, 'tokenSell is correct');
					event.amountSell
						.toString()
						.should.eq(web3.utils.toWei('1', 'ether'), 'amountSell is correct');
					event.userFill.should.eq(user2, 'filled user is correct');
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct');
				});
			});
		});

		describe('failure', async () => {
			it('rejects invalid order ids', async () => {
				await exchange
					.fillOrder(666, { from: user2 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});

			it('rejects already filled orders', async () => {
				await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled;
				await exchange
					.fillOrder('1', { from: user2 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});

			it('rejects cancelled orders', async () => {
				await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled;
				await exchange
					.fillOrder('1', { from: user2 })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});

		describe('cancel order', async () => {
			let result;

			describe('success', async () => {
				beforeEach(async () => {
					result = await exchange.cancelOrder('1', { from: user1 });
				});

				it('updates canceledOrders mapping', async () => {
					const canceledOrder = await exchange.canceledOrders(1);
					canceledOrder.should.eq(true);
				});

				it('emits CancelOrder event', () => {
					const log = result.logs[0];
					log.event.should.eq('CancelOrder');
					const event = log.args;
					event.id.toString().should.eq('1', 'id is correct');
					event.user.should.eq(user1, 'user address is corrent');
					event.tokenBuy.should.eq(token.address, 'tokenBuy is correct');
					event.amountBuy
						.toString()
						.should.eq(web3.utils.toWei('1', 'ether'), 'amountBuy is correct');
					event.tokenSell.should.eq(ETH_ADDRESS, 'tokenSell is correct');
					event.amountSell
						.toString()
						.should.eq(web3.utils.toWei('1', 'ether'), 'amountSell is correct');
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct');
				});
			});

			describe('failure', async () => {
				it('rejects invalid order id', async () => {
					await exchange
						.cancelOrder(666, { from: user1 })
						.should.be.rejectedWith('VM Exception while processing transaction: revert');
				});

				it('rejects attemps to cancel foreign order', async () => {
					await exchange
						.cancelOrder(1, { from: user2 })
						.should.be.rejectedWith('VM Exception while processing transaction: revert');
				});
			});
		});
	});
});
