const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const path = require('path');

const app = express();
const port = 2444;

// IPFS client setup
const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Routes
app.post('/api/certificate', upload.single('certificateImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { certificateId, studentName, courseName, issueDate } = req.body;
        
        // Validate required fields
        if (!certificateId || !studentName || !courseName || !issueDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Upload file to IPFS
        const fileResult = await ipfs.add(req.file.buffer);
        const ipfsHash = fileResult.path;

        res.json({ 
            success: true, 
            message: 'Certificate stored successfully',
            ipfsHash: ipfsHash
        });
    } catch (error) {
        console.error('Error storing certificate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error storing certificate: ' + error.message 
        });
    }
});

app.get('/api/certificate/:ipfsHash', async (req, res) => {
    try {
        const ipfsHash = req.params.ipfsHash;
        
        // Get file chunks from IPFS
        const chunks = [];
        for await (const chunk of ipfs.cat(ipfsHash)) {
            chunks.push(chunk);
        }
        
        // Combine chunks into a single buffer
        const fileData = Buffer.concat(chunks);
        
        // Send the file
        res.setHeader('Content-Type', 'image/*');
        res.send(fileData);
    } catch (error) {
        console.error('Error retrieving certificate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving certificate: ' + error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
