export const config = {
  databaseUrl: process.env.DATABASE_URL || 'mongodb://mongo',
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'debug',
  prettyLogs: process.env.PRETTY_LOGS === 'true',
  logsDestination: process.env.LOGS_DESTINATION || '/app/logs/out.log',
  version: process.env.COMMIT_HASH || 'v0.0.0',
  s3Bucket: process.env.S3_BUCKET || 'api-bucket',
  awsEndpoint: process.env.AWS_ENDPOINT,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  jwtSecret: process.env.JWT_SECRET || 'yourjsonwebtokensecret',
  auth0Domain: process.env.AUTH0_DOMAIN || 'trumarket-dev.eu.auth0.com',
  blockchainRpcUrl:
    process.env.BLOCKCHAIN_RPC_URL || 'http://host.docker.internal:8545/',
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  blockchainChainId: process.env.BLOCKCHAIN_CHAIN_ID || '',
  dealsManagerContractAddress: process.env.DEALS_MANAGER_CONTRACT_ADDRESS || '',
  automaticDealsAcceptance: process.env.AUTOMATIC_DEALS_ACCEPTANCE === 'true',
  emailHost: process.env.EMAIL_HOST || '',
  emailUsername: process.env.EMAIL_USERNAME || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
};
