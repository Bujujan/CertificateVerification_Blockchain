// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    struct Certificate {
        string studentName;
        string courseName;
        uint256 issueDate;
        string certificateId;
        string ipfsHash;
        bool isValid;
    }
    
    mapping(string => Certificate) public certificates;
    address public owner;
    
    event CertificateIssued(
        string certificateId,
        string studentName,
        string courseName,
        uint256 issueDate,
        string ipfsHash
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function issueCertificate(
        string memory studentName,
        string memory courseName,
        string memory certificateId,
        uint256 issueDate,
        string memory ipfsHash
    ) public onlyOwner {
        require(certificates[certificateId].issueDate == 0, "Certificate ID already exists");
        
        certificates[certificateId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            issueDate: issueDate,
            certificateId: certificateId,
            ipfsHash: ipfsHash,
            isValid: true
        });
        
        emit CertificateIssued(certificateId, studentName, courseName, issueDate, ipfsHash);
    }
    
    function verifyCertificate(string memory certificateId) 
        public 
        view 
        returns (
            string memory studentName,
            string memory courseName,
            uint256 issueDate,
            string memory ipfsHash,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[certificateId];
        require(cert.issueDate != 0, "Certificate does not exist");
        return (cert.studentName, cert.courseName, cert.issueDate, cert.ipfsHash, cert.isValid);
    }
}
