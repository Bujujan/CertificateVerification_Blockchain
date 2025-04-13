const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the contract factory
  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  
  // Deploy the contract
  const certificateVerification = await CertificateVerification.deploy();
  await certificateVerification.deployed();

  console.log("CertificateVerification deployed to:", certificateVerification.address);

  // Get the contract ABI
  const artifact = require("../artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");
  
  // Create the config object
  const config = {
    address: certificateVerification.address,
    abi: artifact.abi
  };

  // Write the contract address and ABI to a file
  fs.writeFileSync(
    path.join(__dirname, "../public/contract-config.json"),
    JSON.stringify(config, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
