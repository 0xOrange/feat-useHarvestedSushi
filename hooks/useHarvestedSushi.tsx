import { useState, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import useLogs from "./useLogs";

const SUSHI_TOKEN = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
const MASTER_CHEF = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";

const transferEvent = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

export default function useHarvestedSushi(address: string) {
  const [harvestedSushi, setHarvestedSushi] = useState<null | BigNumber>(null);

  const filter = {
    address: SUSHI_TOKEN,
    topics: [
      ethers.utils.id("Transfer(address,address,uint256)"),
      ethers.utils.hexZeroPad(MASTER_CHEF, 32),
      ethers.utils.hexZeroPad(address, 32),
    ],
  };
  const { eventLogs, error } = useLogs(filter, 10959148);

  useEffect(() => {
    const total = eventLogs
      .map((l) => new ethers.utils.Interface(transferEvent).parseLog(l).args[2])
      .reduce((l1, l2) => l1.add(l2), BigNumber.from(0));

    setHarvestedSushi(total);
  }, [eventLogs]);

  return { harvestedSushi, error };
}
