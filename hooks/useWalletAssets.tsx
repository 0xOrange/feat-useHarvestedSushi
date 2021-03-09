import { Contract, ethers, BigNumber } from "ethers";
import tokenList from "../sushiswapTokenList.json"; // // https://raw.githubusercontent.com/sushiswapclassic/token-list/master/sushiswap.tokenlist.json
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import _find from "lodash/find";
import { boringHelperContract } from "../abi/contracts";

const BORING_HELPER = "0xD132Ce8eA8865348Ac25E416d95ab1Ba84D216AF"; // Helper by @BoringCrypto to get balances in single call
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

function useBlockNumber() {
  const [blockNum, setBlockNum] = useState<number | null>(null);
  const { library: web3 } = useWeb3React<ethers.providers.Web3Provider>();

  useEffect(() => {
    const blockCb = (bl) => setBlockNum(bl);
    web3.on("block", blockCb);

    return () => web3.removeListener("block", blockCb);
  }, []);

  return blockNum;
}

export default function useWalletBalances(address: string) {
  // NOTE: remove if liveness not needed
  const blockNumber = useBlockNumber();
  const [balances, setBalances] = useState<
    {
      tokenInfo: any;
      balance: BigNumber;
      rate: BigNumber;
    }[]
  >([]);
  const [ethRate, setEthRate] = useState<BigNumber | null>(null);
  const { library: web3 } = useWeb3React<ethers.providers.Web3Provider>();
  const addressList = tokenList.tokens.map((t) => t.address);

  useEffect(() => {
    async function getBalances() {
      const balances = await boringHelperContract(web3).getBalances(
        address,
        addressList,
        FACTORY_ADDRESS,
        WETH
      );

      setBalances(
        balances.map(([address, balance, rate]) => {
          if (address.toLowerCase() === USDC.toLowerCase()) {
            setEthRate(BigNumber.from(rate));
          }
          if (address.toLowerCase() === WETH.toLowerCase()) {
            rate = BigNumber.from(10).pow(18);
          }

          return {
            tokenInfo: _find(
              tokenList.tokens,
              (i: any) => i.address.toLowerCase() === address.toLowerCase()
            ),
            balance: BigNumber.from(balance),
            rate: BigNumber.from(rate),
          };
        })
      );
    }

    if (blockNumber != null) {
      getBalances();
    }
  }, [address, blockNumber]);

  return {
    balances: balances.filter((b) => b.balance.gt(0) && b.rate.gt(0)),
    ethRate,
  };
}
