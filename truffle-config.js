require('dotenv').config();

module.exports = {
	networks: {
		development: {
			host: '127.0.0.1', // Localhost (default: none)
			port: 7545,
			network_id: '*', // Any network (default: none)
		},
	},

	contracts_directory: './contracts/',
	contracts_build_directory: './abis/',

	compilers: {
		solc: {
			version: '^0.6',
			optimizer: {
				enabled: false,
				runs: 200,
			},
		},
	},
};
