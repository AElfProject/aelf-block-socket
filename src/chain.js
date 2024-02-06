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

  let currentRoundInformation;
  try {
    console.log('init consensus');
    const consensusContract = await aelf.chain.contractAt(CONSENSUS_ADDRESS, newWallet);
    console.log('Consensus contract init done');
    currentRoundInformation = await consensusContract.GetCurrentRoundInformation.call();
  } catch(error) {
    console.log('get currentRoundInformation error', error);
    return {};
  }
  // console.log('currentRoundInformation', currentRoundInformation);
  console.log('get currentRoundInformation done',);
  if (!currentRoundInformation || !currentRoundInformation.realTimeMinersInformation) {
    return {};
  }
  const {realTimeMinersInformation} = currentRoundInformation;
  const producedBlocksCurrent = {};
  for (const [key, value] of Object.entries(realTimeMinersInformation)) {
    producedBlocksCurrent[key] = value.producedBlocks || 0;
  }
  console.log('producedBlocksCurrent format done');
  return producedBlocksCurrent;
}
async function election() {
  let pageableCandidateInformation = {value: []};
  try {
    console.log('init election');
    const electionContract = await aelf.chain.contractAt(ELECTION_ADDRESS, newWallet);
    console.log('Election contract init done');
    const candidates = await electionContract.GetCandidates.call();
    const candidatesAmount = candidates.value.length;
    for (let index = 0; index < candidatesAmount; index += 20) {
      const candidateInformation = await electionContract.GetPageableCandidateInformation.call({
        start: index,
        length: 20
      });
      pageableCandidateInformation.value = [
        ...pageableCandidateInformation.value,
        ...candidateInformation.value
      ];
    }
  } catch(error) {
    console.log('GetPageableCandidateInformation error', error);
    return {};
  }
  // console.log('GetPageableCandidateInformation done', pageableCandidateInformation);
  console.log('GetPageableCandidateInformation done');
  const producedBlocksHistory = {}

  if (!pageableCandidateInformation || !pageableCandidateInformation.value || !pageableCandidateInformation.value.length) {
    return producedBlocksHistory;
  }
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

  for (const [key, value] of Object.entries(producedBlocksHistory)) {
    producedBlocks[key] = producedBlocksCurrent[key] ? +producedBlocksCurrent[key] + +value : +value;
  }
  // for (const [key, value] of Object.entries(producedBlocksCurrent)) {
  //   producedBlocks[key] = producedBlocksHistory[key] ? +producedBlocksHistory[key] + +value : +value;
  // }
  console.log('producedBlocks', producedBlocks, Object.keys(producedBlocks).length);
  return producedBlocks;
}
