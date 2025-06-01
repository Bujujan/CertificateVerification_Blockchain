let web3;
let userManagementContract;
let isMetaMaskConnected = false;

const HARDHAT_CHAIN_ID = '0x7a69'; // Chain ID 31337 in hex
const HARDHAT_NETWORK = {
    chainId: HARDHAT_CHAIN_ID,
    chainName: 'Hardhat Network',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545']
};

async function checkAndSwitchNetwork() {
    try {
        // Check if we're on the right network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== HARDHAT_CHAIN_ID) {
            try {
                // Try to switch to Hardhat Network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: HARDHAT_CHAIN_ID }],
                });
                return true;
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [HARDHAT_NETWORK],
                        });
                        return true;
                    } catch (addError) {
                        console.error('Error adding Hardhat network:', addError);
                        return false;
                    }
                }
                console.error('Error switching to Hardhat network:', switchError);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
}

async function checkMetaMaskConnection() {
    const messageDiv = document.getElementById('message');
    const loginForm = document.getElementById('loginForm');
    const connectButton = document.getElementById('connectMetaMask');
    const reconnectButton = document.getElementById('reconnectMetaMask');

    // Hide both buttons initially
    connectButton.style.display = 'none';
    reconnectButton.style.display = 'none';

    if (typeof window.ethereum === 'undefined') {
        messageDiv.textContent = 'Please install MetaMask to use this application';
        messageDiv.className = 'message error';
        loginForm.style.display = 'none';
        return false;
    }

    try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            try {
                // Check and switch to Hardhat network
                const networkSwitched = await checkAndSwitchNetwork();
                if (!networkSwitched) {
                    messageDiv.textContent = 'Please switch to Hardhat Network in MetaMask';
                    messageDiv.className = 'message error';
                    reconnectButton.style.display = 'block';
                    loginForm.style.display = 'none';
                    return false;
                }

                web3 = new Web3(window.ethereum);
                const response = await fetch('/contract-config.json');
                const config = await response.json();
                userManagementContract = new web3.eth.Contract(config.userManagementABI, config.userManagementAddress);
                
                isMetaMaskConnected = true;
                messageDiv.textContent = 'MetaMask Connected to Hardhat Network';
                messageDiv.className = 'message success';
                loginForm.style.display = 'block';
                return true;
            } catch (error) {
                console.error('Error initializing Web3:', error);
                messageDiv.textContent = 'Error connecting to Hardhat network. Make sure your local node is running.';
                messageDiv.className = 'message error';
                reconnectButton.style.display = 'block';
                loginForm.style.display = 'none';
                return false;
            }
        } else {
            messageDiv.textContent = 'Please connect your MetaMask wallet';
            messageDiv.className = 'message error';
            connectButton.style.display = 'block';
            loginForm.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Error checking MetaMask connection:', error);
        messageDiv.textContent = 'Error connecting to MetaMask. Click below to retry.';
        messageDiv.className = 'message error';
        reconnectButton.style.display = 'block';
        loginForm.style.display = 'none';
        return false;
    }
}

async function connectMetaMask() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Connecting to MetaMask...';
    messageDiv.className = 'message';

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await checkMetaMaskConnection();
    } catch (error) {
        console.error('User denied account access or error occurred:', error);
        messageDiv.textContent = 'Connection failed. Please try again.';
        messageDiv.className = 'message error';
        document.getElementById('connectMetaMask').style.display = 'block';
        document.getElementById('reconnectMetaMask').style.display = 'block';
    }
}

async function reconnectMetaMask() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Attempting to reconnect...';
    messageDiv.className = 'message';
    
    try {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
        }
        await checkMetaMaskConnection();
    } catch (error) {
        console.error('Reconnection failed:', error);
        messageDiv.textContent = 'Reconnection failed. Please try again.';
        messageDiv.className = 'message error';
    }
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!isMetaMaskConnected) {
        await connectMetaMask();
        if (!isMetaMaskConnected) return;
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const accounts = await web3.eth.getAccounts();
        if (!accounts || accounts.length === 0) {
            messageDiv.textContent = 'No MetaMask account connected. Please connect your wallet.';
            messageDiv.className = 'message error';
            return;
        }

        messageDiv.textContent = 'Attempting to login...';
        messageDiv.className = 'message';

        // First check if the user exists
        const userInfo = await userManagementContract.methods.users(accounts[0]).call();
        console.log('User info:', userInfo);

        if (!userInfo.exists) {
            messageDiv.textContent = 'No user found for this account. Please register first.';
            messageDiv.className = 'message error';
            return;
        }

        // Now try to login with plain password
        const loginResult = await userManagementContract.methods.login(String(password)).call({
            from: accounts[0]
        });
        
        console.log('Login result:', loginResult);
        
        // Explicitly handle the return values as they come from the contract
        const success = Boolean(loginResult[0]); // First return value is success (bool)
        const userRole = Number(loginResult[1]); // Second return value is userRole (uint8)
        
        if (success) {
            localStorage.setItem('userRole', userRole.toString());
            localStorage.setItem('userAddress', accounts[0]);
            
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.className = 'message success';
            
            // Redirect based on role
            setTimeout(() => {
                if (userRole.toString() === '0') { // Student
                    window.location.href = '/student.html';
                } else { // Teacher
                    window.location.href = '/teacher.html';
                }
            }, 1000);
        } else {
            messageDiv.textContent = 'Invalid password';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageDiv.textContent = 'An error occurred during login. Please try again.';
        messageDiv.className = 'message error';
        document.getElementById('reconnectMetaMask').style.display = 'block';
    }
});

// Add event listeners for the connection buttons
document.getElementById('connectMetaMask').addEventListener('click', connectMetaMask);
document.getElementById('reconnectMetaMask').addEventListener('click', reconnectMetaMask);

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        checkMetaMaskConnection();
    });

    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });

    window.ethereum.on('disconnect', function (error) {
        console.log('MetaMask disconnected');
        isMetaMaskConnected = false;
        checkMetaMaskConnection();
    });
}

// Initialize on page load
window.addEventListener('load', checkMetaMaskConnection); 