'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import CONTRACTABI from './contractABI.json';
import Banner from '../../components/banner';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Home() {
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const [inputWalletAddress, setInputWalletAddress] = useState("0xf2d22....998f425");
  const [walletAddress, setWalletAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [nftName, setNftName] = useState('');
  const [nftMetadata, setNftMetadata] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [price, setPrice] = useState('');
  const [supply, setSupply] = useState('');
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACTABI, signer);
        setWalletAddress(accounts[0]); // from MetaMask
        setContract(contractInstance);
        console.log('✅ Connected via MetaMask');
      } catch (err) {
        console.error('❌ Wallet connection error:', err);
      }
    } else {
      alert('Please install MetaMask.');
    }
  };

  const submitManualAddress = () => {
    if (!ethers.isAddress(inputWalletAddress)) {
      alert('Invalid wallet address.');
      return;
    }
    setWalletAddress(inputWalletAddress);
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then((signer) => {
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACTABI, signer);
      setContract(contractInstance);
      console.log('✅ Contract connected with manual address');
    }).catch((err) => {
      console.error('❌ Contract setup error:', err);
    });
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setContract(null);
  };

  const fetchListings = async () => {
    if (!contract) return;
    setLoadingListings(true);
    try {
      const rawListings = await contract.getAllListings();
      const processedListings = await Promise.all(
        rawListings.map(async (nft) => {
          try {
            const res = await fetch(nft.tokenURI);
            const metadata = await res.json();
            return {
              tokenId: Number(nft.tokenId),
              seller: nft.seller,
              price: ethers.formatEther(nft.price),
              supply: Number(nft.supply),
              metadata,
            };
          } catch (err) {
            console.error(`❌ Metadata error for tokenId ${nft.tokenId}:`, err);
            return null;
          }
        })
      );
      setListings(processedListings.filter(Boolean));
    } catch (err) {
      console.error('❌ Fetching listings failed:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (contract) fetchListings();
  }, [contract]);

  const uploadToIPFS = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.IpfsHash;
    } catch (err) {
      console.error('❌ IPFS Image Upload Error:', err);
    }
  };

  const pinJSONToIPFS = async (name, description, imageCID, price, supply) => {
    const metadata = {
      name,
      description,
      image: `https://gateway.pinata.cloud/ipfs/${imageCID}`,
      price,
      supply,
    };
    try {
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JSON_KEY}`,
        },
        body: JSON.stringify(metadata),
      });
      const data = await res.json();
      return data.IpfsHash;
    } catch (err) {
      console.error('❌ Metadata upload failed:', err);
    }
  };

  const handleMintAndList = async (e) => {
    e.preventDefault();
    if (!contract) return alert('Contract not connected.');
    if (!nftName || !nftMetadata || !imageFile || !price || !supply) {
      return alert('Fill all fields.');
    }
    try {
      const imageCID = await uploadToIPFS(imageFile);
      if (!imageCID) return alert('Image upload failed.');
      const metadataCID = await pinJSONToIPFS(nftName, nftMetadata, imageCID, price, supply);
      const metadataURL = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
      const tx = await contract.mintAndListNFT(
        metadataURL,
        ethers.parseEther(price.toString()),
        parseInt(supply)
      );
      await tx.wait();
      alert('✅ NFT minted and listed!');
      fetchListings();
    } catch (err) {
      console.error('❌ Minting error:', err);
    }
  };

  const handleBuyPrompt = async (item) => {
    if (!contract) return alert('Contract not connected.');
    const amountStr = prompt(`How many "${item.metadata.name}" NFTs to buy?`);
    const amount = parseInt(amountStr);
    if (!amount || amount <= 0) return alert('❌ Invalid amount.');
    try {
      const totalPrice = ethers.parseEther((parseFloat(item.price) * amount).toString());
      const tx = await contract.buyNFT(item.tokenId, amount, { value: totalPrice });
      await tx.wait();
      alert('✅ NFT purchased!');
      fetchListings();
    } catch (err) {
      console.error('❌ Buy error:', err);
    }
  };

  return (
    <div className="App min-h-screen flex flex-col">
      <Navbar 
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />
      
      <main className="main-content">
        <div className="">
          {/* <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#a5173a] via-[#aeaae9] to-[#a5173a] text-center text-4xl font-bold mb-8">ERC1155 NFT Marketplace</h1> */}
      
      <Banner
          name={
            <span className="banner-name">
              Discover, collect, and sell creative NFTs
            </span>
          }
          childStyles=""
          parentStyles="justify-center mb-7 h-72 sm:h-60 p-12 xs:p-4 xs:h-44 rounded-3xl"
        />

      {!walletAddress ? (
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitManualAddress();
            }}
          >
            <label className="wallet-address">Enter Wallet Address:</label>
            <input
              type="text"
              value={inputWalletAddress}
              onChange={(e) => setInputWalletAddress(e.target.value)}
            />
            <button type="submit">Submit Address</button>
          </form>

          <p className='text-center'>OR</p>

          <button onClick={connectWallet}>Connect with MetaMask</button>
        </div>
      ) : (
        <>
         <p className="font-mono">
  <strong>Connected Wallet:</strong> {walletAddress}
        </p>
          <button onClick={disconnectWallet}>Disconnect</button>

          <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-[#a5173a] via-[#aeaae9] to-[#a5173a]">Marketplace Listings</h2>
          {loadingListings ? (
            <p>Loading...</p>
          ) : listings.length === 0 ? (
            <p>No NFTs listed.</p>
          ) : (
            <div className="nft-grid">
              {listings.map((item) => (
                <div key={item.tokenId} className="nft-card">
                  <img src={item.metadata.image} alt={item.metadata.name} />
                  <h3>{item.metadata.name}</h3>
                  <p>{item.metadata.description}</p>
                  <p><strong>Token ID:</strong> {item.tokenId}</p>
                  <p><strong>Price:</strong> {item.price} ETH</p>
                  <p>
                    <strong>Seller:</strong> {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                  </p>
                  <button onClick={() => handleBuyPrompt(item)}>Buy</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleMintAndList} className="nft-form">
            <div>
              <label>NFT Name:</label>
              <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)} />
            </div>
            <div>
              <label>Description:</label>
              <textarea value={nftMetadata} onChange={(e) => setNftMetadata(e.target.value)} />
            </div>
            <div>
              <label>Image File:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </div>
            <div>
              <label>Price (ETH):</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label>Supply:</label>
              <input type="number" value={supply} onChange={(e) => setSupply(e.target.value)} />
            </div>
            <button type="submit">Mint & List NFT</button>
          </form>
        </>
      )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
