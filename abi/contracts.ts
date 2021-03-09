import { Contract, ethers } from "ethers";
import makerInfoAbi from "./makerInfo.json";
import makerAbi from "./maker.json";
import barAbi from "./bar.json";
import boringAbi from "./boringHelper.json";

const MAKER_INFO = "0x001c92D884fe654A6C5438fa85a222aA400C1999";
const MAKER = "0xE11fc0B43ab98Eb91e9836129d1ee7c3Bc95df50";
const SUSHI_BAR = "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272";
const BORING_HELPER = "0xD132Ce8eA8865348Ac25E416d95ab1Ba84D216AF"; // Helper by @BoringCrypto to get balances in single call

export const makerInfoContract = (web3: ethers.providers.Web3Provider) =>
  new Contract(MAKER_INFO, makerInfoAbi.abi, web3);
export const makerContract = (web3: ethers.providers.Web3Provider | any) =>
  new Contract(MAKER, makerAbi.abi, web3);
export const barContract = (web3: ethers.providers.Web3Provider) =>
  new Contract(SUSHI_BAR, barAbi.abi, web3);
export const boringHelperContract = (web3: ethers.providers.Web3Provider) =>
  new Contract(BORING_HELPER, boringAbi.abi, web3);
