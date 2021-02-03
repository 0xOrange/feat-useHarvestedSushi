import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";

// TODO: Cache
export default (eventFilter: ethers.EventFilter, fromBlock?: number) => {
  const { library: web3 } = useWeb3React<ethers.providers.Web3Provider>();
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [error, setError] = useState<number | null>(null);
  useEffect(() => {
    const filter = {
      ...eventFilter,
      fromBlock,
    };

    try {
      web3.getLogs(filter).then((l) => setEventLogs(l));
      setError(null);
    } catch (e) {
      setError(e.code || -1);
    }

    const eventCb = (l: any) => {
      setEventLogs([...eventLogs, l]);
    };
    try {
      web3.on(filter, eventCb);
      setError(null);
    } catch (e) {
      setError(e.code || -1);
    }

    return () => web3.removeListener(filter, eventCb);
  }, [eventFilter, fromBlock]);

  return { eventLogs, error };
};
