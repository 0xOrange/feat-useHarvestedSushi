import { useWeb3React } from "@web3-react/core";
import { ethers, BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { makerInfoContract, barContract } from "../abi/contracts";
import _ from "lodash";

const bn10e18 = BigNumber.from("1000000000000000000");
const bn0 = BigNumber.from(0);

const ethToCurrency = (value: number, eth_rate: BigNumber) =>
  eth_rate.mul(value).div(bn10e18);

export default function useSushiKitchen(address: string, currency: string) {
  const [pools, setPools] = useState<
    {
      pair: string;
      name: string;
      value: BigNumber;
      userShare: BigNumber;
      token0: string;
      token1: string;
    }[]
  >([]);
  const [kitchen, setKitchen] = useState<{
    totalKitchen: BigNumber;
    totalUserShare: BigNumber;
  } | null>(null);
  const { library: web3 } = useWeb3React<ethers.providers.Web3Provider>();

  useEffect(() => {
    async function getKitchen(address: string, currency: string) {
      const pids = [...Array(101).keys()].filter(
        (pid) =>
          pid != 29 &&
          pid != 30 &&
          pid != 33 &&
          pid != 45 &&
          pid != 61 &&
          pid != 62
      );
      const result = await makerInfoContract(web3).getPairs(
        pids,
        currency,
        "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
        { gasLimit: 50000000 }
      );
      const ethRate = BigNumber.from(result[0]);

      const makerPairs: any[] = [];
      for (var i in result[1]) {
        let pair: any = {};
        pair.pair = result[1][i].lpToken;
        pair.balance = BigNumber.from(result[1][i].makerBalance);
        pair.totalSupply = BigNumber.from(result[1][i].totalSupply);
        pair.reserve0 = BigNumber.from(result[1][i].reserve0);
        pair.reserve1 = BigNumber.from(result[1][i].reserve1);
        pair.token0rate = BigNumber.from(result[1][i].token0rate);
        pair.token1rate = BigNumber.from(result[1][i].token1rate);
        pair.token0 = result[1][i].token0;
        pair.token1 = result[1][i].token1;
        pair.token0symbol = result[1][i].token0symbol;
        pair.token1symbol = result[1][i].token1symbol;

        pair.name = pair.token0symbol + "-" + pair.token1symbol;

        pair.shareOfPool = pair.totalSupply.eq(0)
          ? bn0
          : pair.balance.mul(bn10e18).div(pair.totalSupply);
        pair.totalToken0 = pair.reserve0.mul(pair.shareOfPool).div(bn10e18);
        pair.totalToken1 = pair.reserve1.mul(pair.shareOfPool).div(bn10e18);

        pair.valueToken0 = pair.token0rate.eq(0)
          ? bn0
          : pair.totalToken0.mul(bn10e18).div(pair.token0rate);
        pair.valueToken1 = pair.token1rate.eq(0)
          ? bn0
          : pair.totalToken1.mul(bn10e18).div(pair.token1rate);
        pair.valueToken0InCurrency = ethToCurrency(pair.valueToken0, ethRate);
        pair.valueToken1InCurrency = ethToCurrency(pair.valueToken1, ethRate);
        pair.totalValueInCurrency = pair.valueToken0InCurrency.add(
          pair.valueToken1InCurrency
        );

        // @ts-ignore
        if (i >= makerPairs.length) {
          makerPairs.push(pair);
        } else {
          makerPairs[i] = pair;
        }
      }

      let totalKitchen = bn0;
      for (let i = 0; i < makerPairs.length; i++) {
        if (i != 2) {
          totalKitchen = totalKitchen.add(makerPairs[i].totalValueInCurrency);
        }
      }

      const xsushi = BigNumber.from(await barContract(web3).balanceOf(address));
      const totalXSushi = BigNumber.from(await barContract(web3).totalSupply());
      const poolShare = xsushi.mul(bn10e18).div(totalXSushi);
      let totalUserShare = bn0;
      const p = {};
      for (let i = 0; i < makerPairs.length; i++) {
        if (i != 2) {
          const userShare = makerPairs[i].totalValueInCurrency
            .mul(poolShare)
            .div(bn10e18);

          p[makerPairs[i].pair] = {
            name: makerPairs[i].name,
            value: makerPairs[i].totalValueInCurrency,
            userShare: userShare,
            token0: makerPairs[i].token0,
            token1: makerPairs[i].token1,
          };
          totalUserShare = totalUserShare.add(userShare);
        }
      }

      setPools(Object.keys(p).map((pair) => ({ pair, ...p[pair] })));
      setKitchen({ totalKitchen, totalUserShare });
    }

    getKitchen(address, currency);
  }, [address, currency]);

  return { kitchen, pools };
}
