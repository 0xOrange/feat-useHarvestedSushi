import { ethers } from "ethers";

const run = async (address: string) => {
  console.log("Address: ", address);
};

const address = process.argv[2];
if (!ethers.utils.isAddress(address)) {
  console.error("Invalid address");
} else {
  run(address);
}

export {};
