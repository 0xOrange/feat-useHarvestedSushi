import { ethers, BigNumber, utils } from "ethers";
const SUSHI_TOKEN = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
const MASTER_CHEF = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";

const web3 = new ethers.providers.InfuraProvider("homestead");
const abi = [
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
const iface = new ethers.utils.Interface(abi);

const harvestedSushiSinceLockup = async (address: string) => {
  const filter = {
    address: SUSHI_TOKEN,
    fromBlock: 10959148,
    topics: [
      ethers.utils.id("Transfer(address,address,uint256)"),
      ethers.utils.hexZeroPad(MASTER_CHEF, 32),
      ethers.utils.hexZeroPad(address, 32),
    ],
  };

  const logs = await web3.getLogs(filter);

  const total = logs
    .map((l) => iface.parseLog(l).args[2])
    .reduce((l1, l2) => l1.add(l2), BigNumber.from(0));

  console.log("SUSHI harvested since lockup: ", utils.formatUnits(total, 18));
  return total;
};

const address = process.argv[2];
if (!ethers.utils.isAddress(address)) {
  console.error("Invalid address");
} else {
  harvestedSushiSinceLockup(address);
}

export {};
