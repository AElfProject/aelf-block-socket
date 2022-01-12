const AElf = require('aelf-sdk');
const {AELF_ENDPOINT, CONSENSUS_ADDRESS, ELECTION_ADDRESS} = require('../config');

module.exports = {
  producedBlocks
};

const aelf = new AElf(
  new AElf.providers.HttpProvider(AELF_ENDPOINT)
);

const newWallet = AElf.wallet.createNewWallet();

async function consensus () {
  console.log('init consensus');
  const consensusContract = await aelf.chain.contractAt(CONSENSUS_ADDRESS, newWallet);
  console.log('Consensus contract init done');
  const currentRoundInformation = await consensusContract.GetCurrentRoundInformation.call();
  // console.log('currentRoundInformation', currentRoundInformation);
  console.log('get currentRoundInformation done',);
  if (!currentRoundInformation || !currentRoundInformation.realTimeMinersInformation) {
    return;
  }
  const {realTimeMinersInformation} = currentRoundInformation;
  const producedBlocksCurrent = {};
  for (const [key, value] of Object.entries(realTimeMinersInformation)) {
    producedBlocksCurrent[key] = value.producedBlocks || 0;
  }
  // console.log('producedBlocksCurrent', producedBlocksCurrent);
  return producedBlocksCurrent;
}
async function election() {
  console.log('init election');
  const electionContract = await aelf.chain.contractAt(ELECTION_ADDRESS, newWallet);
  console.log('Election contract init done');
  const pageableCandidateInformation = await electionContract.GetPageableCandidateInformation.call({
    start: 0,
    length: 100000000
  });
  // console.log('GetPageableCandidateInformation done', pageableCandidateInformation);
  console.log('GetPageableCandidateInformation done');
  if (!pageableCandidateInformation || !pageableCandidateInformation.value || !pageableCandidateInformation.value.length) {
    return;
  }
  const producedBlocksHistory = {}
  pageableCandidateInformation.value.forEach(item => {
    const {pubkey, producedBlocks} = item.candidateInformation;
    producedBlocksHistory[pubkey] = producedBlocks;
  });
  // console.log('producedBlocksHistory', producedBlocksHistory);
  return producedBlocksHistory;
}

async function producedBlocks() {
  const [
    producedBlocksCurrent,
    producedBlocksHistory
  ] = await Promise.all([consensus(), election()]);

  const producedBlocks = {};

  for (const [key, value] of Object.entries(producedBlocksCurrent)) {
    producedBlocks[key] = producedBlocksHistory[key] ? +producedBlocksHistory[key] + +value : +value;
  }
  console.log('producedBlocks', producedBlocks);
  return producedBlocks;
}
