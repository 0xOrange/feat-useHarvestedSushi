import { utils, Contract, ethers, BigNumber } from "ethers";
import v2Pair from "../abi/v2pair.json";
import boringHelper from "../abi/boringHelper.json";
import _find from "lodash/find";
// https://raw.githubusercontent.com/sushiswapclassic/token-list/master/sushiswap.tokenlist.json
import tokenList from "../sushiswapTokenList.json";

const web3 = new ethers.providers.InfuraProvider("homestead");

const BORING_HELPER = "0xD132Ce8eA8865348Ac25E416d95ab1Ba84D216AF";
// { FACTORY_ADDRESS, INIT_CODE_HASH } from "@uniswap/sdk";
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const getBalances = async (address: string) => {
  const addressList = tokenList.tokens.map((t) => t.address);
  const balances = await new Contract(
    BORING_HELPER,
    boringHelper.abi,
    web3
  ).getBalances(address, addressList, FACTORY_ADDRESS, WETH);

  let ethRate = undefined;

  const availableBalances = balances
    .map(([address, balance, rate]) => {
      if (
        address.toLowerCase() ===
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".toLowerCase()
      ) {
        ethRate = BigNumber.from(rate);
      }
      if (address.toLowerCase() === WETH.toLowerCase()) {
        rate = BigNumber.from(10).pow(18);
      }

      const tokenInfo = _find(
        tokenList.tokens,
        (i: any) => i.address.toLowerCase() === address.toLowerCase()
      );
      return {
        tokenInfo,
        balance: BigNumber.from(balance),
        rate: BigNumber.from(rate),
      };
    })
    .filter((b) => b.balance.gt(0) && b.rate.gt(0));

  availableBalances.map((a) => {
    console.log(
      `${utils.formatUnits(a.balance, a.tokenInfo.decimals)} ${
        a.tokenInfo.symbol
      } -- ${utils.formatUnits(a.rate, a.tokenInfo.decimals)} ETH
      -- ${utils.formatUnits(a.balance.mul(ethRate).div(a.rate), 6)} USD`
    );
  });
};

// get the reserves
const getReserves = async (token0: string, token1: string) => {
  const pair = [token0, token1].map((p) => p.toLowerCase()).sort();
  // Compute the pair address
  const pairAddress = utils.getCreate2Address(
    FACTORY_ADDRESS,
    utils.solidityKeccak256(
      ["bytes"],
      [utils.solidityPack(["address", "address"], pair)]
    ),
    INIT_CODE_HASH
  );

  const [reserves0, reserves1] = await new Contract(
    pairAddress,
    v2Pair.abi,
    web3
  ).getReserves();

  return [
    { token: pair[0], reserve: reserves0 },
    { token: pair[1], reserve: reserves1 },
  ];
};

const getEthRate = async (token: string) => {
  const e18 = BigNumber.from(10n ** 18n);
  let ethRate = e18;
  if (token != WETH) {
    const reserves = await getReserves(token, WETH);
    if (reserves[0].token === WETH) {
      ethRate = BigNumber.from(reserves[1].reserve)
        .mul(e18)
        .div(reserves[0].reserve);
    } else {
      ethRate = BigNumber.from(reserves[0].reserve)
        .mul(e18)
        .div(reserves[1].reserve);
    }
  }

  const tokenInfo = _find(
    tokenList.tokens,
    (i: any) => i.address.toLowerCase() === token.toLowerCase()
  );
  console.log("ETH RATE: ", utils.formatUnits(ethRate, tokenInfo.decimals));
};

// getEthRate("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
const address = process.argv[2];
if (!ethers.utils.isAddress(address)) {
  console.error("Invalid address");
} else {
  getBalances(address);
}
