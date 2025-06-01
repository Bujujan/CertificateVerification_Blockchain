const hre = require("hardhat");

async function main() {
    const UserManagement = await hre.ethers.getContractFactory("UserManagement");
    const userManagement = await UserManagement.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

    // Get the first account (which is the one we'll use)
    const [owner] = await hre.ethers.getSigners();
    
    // Register the user as a student (Role.Student = 0)
    const tx = await userManagement.registerUser(
        owner.address,
        "student1",
        "password123",
        0 // Role.Student
    );
    
    await tx.wait();
    console.log("User registered as student:", owner.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 