import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useState, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import useSushiKitchen from "../hooks/useSushiKitchen";
import { makerContract } from "../abi/contracts";
import _sortBy from "lodash";

export default function Home() {
  const { account, activate, active } = useWeb3React();
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [inputAddress, setInputAddress] = useState<string>("");
  useEffect(() => {
    if (active && account) {
      setCurrentAccount(account);
    }
  }, [account]);

  const activateWeb3 = () => {
    if (!active) {
      activate(
        new InjectedConnector({
          supportedChainIds: [1],
        })
      );
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {!currentAccount ? (
          <div>
            <button type="button" onClick={activateWeb3}>
              Connect
            </button>
          </div>
        ) : (
          <>
            <input
              placeholder="Address"
              onChange={(e) => setInputAddress(e.target.value)}
            ></input>
            <button onClick={() => setCurrentAccount(inputAddress)}>
              Check
            </button>

            {ethers.utils.isAddress(currentAccount) && (
              <div style={{ marginTop: "18px" }}>
                Account: {currentAccount}
                <Start address={currentAccount} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}

const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const Start = ({ address }: { address: string }) => {
  const { kitchen, pools } = useSushiKitchen(address, USDT_CONTRACT);

  // @ts-ignore
  const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  const maker = makerContract(signer);

  const convert = async (address: string, token0: string, token1: string) =>
    await maker.convert(token0, token1);

  const convertAll = async (address: string, p: typeof pools) => {
    const lim = p.slice(0, 15);
    const tokens0 = lim.map((pool) => pool.token0);
    const tokens1 = lim.map((pool) => pool.token1);
    await maker.convertMultiple(tokens0, tokens1);
  };

  const sortedPools = pools.sort(
    (p1, p2) =>
      p2.userShare.sub(p1.userShare).toNumber() ||
      p2.value.sub(p1.value).toNumber()
  );

  return (
    <div>
      <p>
        Total Kitchen:
        {kitchen && " $" + ethers.utils.formatUnits(kitchen.totalKitchen, 6)}
      </p>
      <p>
        Your share:
        {kitchen && " $" + ethers.utils.formatUnits(kitchen.totalUserShare, 6)}
      </p>

      <h3>Pools</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Your share</th>
            <th>
              <button onClick={() => convertAll(address, sortedPools)}>
                Serve all
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPools.map((p) => (
            <tr key={p.pair}>
              <th>{p.name} </th>
              <th>${ethers.utils.formatUnits(p.value, 6)}</th>
              <th>${ethers.utils.formatUnits(p.userShare, 6)}</th>
              <th>
                <button onClick={() => convert(address, p.token0, p.token1)}>
                  Serve
                </button>
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
