const T_Token = artifacts.require('./Token');

require('chai').use(require('chai-as-promised')).should();

contract('Token', accounts => {
	const deployer = accounts[0];
	const receiver = accounts[1];
	const exchange = accounts[2];
	const name = 'EMG';
	const symbol = 'EMG';
	const decimals = 18 + '';
	const totalSupply = web3.utils.toWei('100', 'ether');

	let token;
	beforeEach(async () => {
		token = await T_Token.new();
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
		let amount;
		let result;
		describe('success: enough tokens', () => {
			beforeEach(async () => {
				amount = web3.utils.toWei('1', 'ether');
				const r = await token.approve(exchange, amount, { from: deployer });
				result = await token.transferFrom(deployer, receiver, amount, { from: exchange });
			});

			it('transfers token balances', async () => {
				const deployerBalanceAfterTransfer = await token.balanceOf(deployer);
				deployerBalanceAfterTransfer.toString().should.equal(web3.utils.toWei('99', 'ether'));
				const receiverBalanceAfterTransfer = await token.balanceOf(receiver);
				receiverBalanceAfterTransfer.toString().should.equal(web3.utils.toWei('1', 'ether'));
			});

			it('resets the allowance', async () => {
				const allowance = await token.allowance(deployer, exchange);
				allowance.toString().should.equal('0');
			});

			it('emits Transfer event', () => {
				const log = result.logs[0];
				log.event.should.equal('Transfer');
				log.args.from.should.equal(deployer, 'from is correct');
				log.args.to.should.equal(receiver, 'to is corrent');
				log.args.value.toString().should.equal(amount, 'amount is correct');
			});
		});

		describe('failure: unsufficient tokens', () => {
			it('rejects unsufficient balances', async () => {
				amount = web3.utils.toWei('101', 'ether');
				await token
					.transfer(receiver, amount, { from: deployer })
					.should.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});

	describe('approving tokens', () => {
		let result;
		let amount;

		beforeEach(async () => {
			amount = web3.utils.toWei('10', 'ether');
			result = await token.approve(exchange, amount, { from: deployer });
		});

		describe('success', () => {
			it('allocates an allowance for exchange to spend token', async () => {
				const allowance = await token.allowance(deployer, exchange);
				allowance.toString().should.equal(amount.toString());
			});

			it('emits approval event', () => {
				const log = result.logs[0];
				log.event.should.eq('Approval');
				const event = log.args;
				event.owner.should.equal(deployer, 'owner is correct');
				event.spender.should.equal(exchange, 'spender is correct');
				log.args.value.toString().should.equal(amount, 'value is correct');
			});
		});

		describe('failure', () => {
			it('rejects insufficient amounts', async () => {
				const amount = web3.utils.toWei('999', 'ether');
				await token
					.transferFrom(deployer, receiver, amount, { from: exchange })
					.should.be.rejectedWith('VM Exception while processing transaction: revert');
			});
		});
	});
});
