const Token = artifacts.require('Token');
const Exchange = artifacts.require('Exchange');

module.exports = async function (deployer) {
	deployer.deploy(Token);
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
