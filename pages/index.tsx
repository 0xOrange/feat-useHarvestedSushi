import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useState, useEffect } from "react";
import useHarvestedSushi from "../hooks/useHarvestedSushi";
import { ethers } from "ethers";

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

            <div style={{ marginTop: "18px" }}>Address: {currentAccount}</div>
            {ethers.utils.isAddress(currentAccount) && (
              <HarvestedSushi address={currentAccount} />
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}

const HarvestedSushi = ({ address }: { address: string }) => {
  const { harvestedSushi, error } = useHarvestedSushi(address);

  return (
    <div>
      Harvested sushi lockup:
      {harvestedSushi != null && !error
        ? ethers.utils.formatUnits(harvestedSushi, 18)
        : "--"}
    </div>
  );
};
