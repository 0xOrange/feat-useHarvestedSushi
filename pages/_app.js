import "../styles/globals.css";

import { useEffect, useState } from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

const MyApp = ({ Component, pageProps }) => {
  const [ethereum, setEthereum] = useState(null);

  useEffect(() => {
    if (window && window.ethereum) {
      setEthereum(window.ethereum);
    }
  });

  useEffect(() => {
    if (window && window.ethereum) {
      setEthereum(window.ethereum);
    }
  });
  return (
    <Web3ReactProvider
      getLibrary={() => new ethers.providers.Web3Provider(ethereum)}
    >
      <Component {...pageProps} />
    </Web3ReactProvider>
  );
};

export default MyApp;
