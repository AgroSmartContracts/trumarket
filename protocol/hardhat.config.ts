import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import dotenv from 'dotenv';

dotenv.config();

const accounts = [];

if (process.env.PRIVATE_KEY) {
  accounts.push(process.env.PRIVATE_KEY);
}

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts,
    },
  },
};

export default config;
