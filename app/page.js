"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const UpgradeSystem = dynamic(() => import('./components/UpgradeSystem'), {
  ssr: false,
});

// Import the cases data
import casesData from './data/cases.json';

export default function Home() {
  // Initialize state with localStorage or defaults
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [cases, setCases] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [showSellDialog, setShowSellDialog] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [openingCase, setOpeningCase] = useState(null);
  const [wonItem, setWonItem] = useState(null);
  const [showWonItem, setShowWonItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Calculate total inventory value
  const totalValue = inventory.reduce((sum, item) => sum + (item?.price || 0), 0);
  // Sort inventory by price (highest first)
  const sortedInventory = [...inventory].sort((a, b) => (b?.price || 0) - (a?.price || 0));
  // Get top 3 most expensive items
  const featuredItems = sortedInventory.slice(0, 3);
  
  // Update balance in state and localStorage
  const updateBalance = (newBalance) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userBalance', newBalance.toString());
    }
    setBalance(newBalance);
  };
  
  // Add amount to balance
  const addToBalance = (amount) => {
    const newBalance = balance + amount;
    updateBalance(newBalance);
    return newBalance;
  };

  // Handle item upgrade
  const handleUpgrade = (oldItem, newItem) => {
    setInventory(prev => {
      // First, remove the old item
      let newInventory = prev.filter(item => item.id !== oldItem.id);
      
      // Only add the new item if the upgrade was successful (newItem is not null)
      if (newItem) {
        newInventory = [...newInventory, { ...newItem, id: Date.now() }];
      }
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInventory', JSON.stringify(newInventory));
      }
      
      return newInventory;
    });
  };
  
  // Add balance with prompt
  const addBalance = () => {
    const amount = parseFloat(prompt('Enter amount to add (max $1000):', '10'));
    if (amount && !isNaN(amount) && amount > 0 && amount <= 1000) {
      addToBalance(amount);
    } else if (amount && (amount <= 0 || amount > 1000)) {
      alert('Please enter a valid amount between $0.01 and $1000');
    }
  };
  
  // Subtract amount from balance
  const subtractFromBalance = (amount) => {
    const newBalance = Math.max(0, balance - amount); // Prevent negative balance
    updateBalance(newBalance);
    return newBalance;
  };
  
  // Get rarity color
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'Covert': return 'text-red-400';
      case 'Classified': return 'text-purple-400';
      case 'Restricted': return 'text-blue-400';
      case 'Mil-Spec': return 'text-sky-400';
      case 'Industrial Grade': return 'text-teal-400';
      case 'Consumer Grade': return 'text-gray-400';
      case 'Rare Special': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  // Calculate upgrade chance based on item rarity
  const calculateUpgradeChance = (rarity) => {
    const rarityChances = {
      'Consumer Grade': 80,
      'Industrial Grade': 65,
      'Mil-Spec': 50,
      'Restricted': 35,
      'Classified': 20,
      'Covert': 10,
      'Rare Special': 5
    };
    return rarityChances[rarity] || 50; // Default to 50% if rarity not found
  };

  // Handle upgrade button click
  const handleUpgradeClick = (item) => {
    const chance = calculateUpgradeChance(item.rarity);
    const isSuccess = Math.random() * 100 < chance;
    
    if (isSuccess) {
      // Get next rarity
      const rarityOrder = [
        'Consumer Grade',
        'Industrial Grade',
        'Mil-Spec',
        'Restricted',
        'Classified',
        'Covert',
        'Rare Special'
      ];
      
      const currentIndex = rarityOrder.indexOf(item.rarity);
      if (currentIndex < rarityOrder.length - 1) {
        const newRarity = rarityOrder[currentIndex + 1];
        const newPrice = Math.floor(item.price * 2.5); // Increase price for upgraded item
        
        // Create upgraded item
        const upgradedItem = {
          ...item,
          rarity: newRarity,
          price: newPrice,
          upgradedFrom: item.rarity,
          upgradedAt: new Date().toISOString()
        };
        
        // Handle the upgrade
        handleUpgrade(item, upgradedItem);
        
        // Show success message
        alert(`Upgrade successful! Your ${item.name} is now ${newRarity} quality!`);
      } else {
        alert('This item is already at the highest rarity!');
      }
    } else {
      // Remove the item on failed upgrade
      setInventory(prev => {
        const newInventory = prev.filter(i => i.id !== item.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('userInventory', JSON.stringify(newInventory));
        }
        return newInventory;
      });
      
      // Show failure message
      alert(`Upgrade failed! The ${item.name} was destroyed in the process.`);
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0.00';
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Handle selling an item
  const handleSellItem = (item) => {
    setShowSellDialog(item);
  };

  // Confirm sell item
  const confirmSellItem = () => {
    if (!showSellDialog) return;
    
    // Add item price to balance
    addToBalance(showSellDialog.price);
    
    // Remove item from inventory and update localStorage
    setInventory(prev => {
      const newInventory = prev.filter(i => i.id !== showSellDialog.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInventory', JSON.stringify(newInventory));
      }
      return newInventory;
    });
    
    // Close dialog
    setShowSellDialog(null);
  };

  // Close won item modal
  const closeWonItem = () => {
    setShowWonItem(false);
    setWonItem(null);
  };

  // Sell won item
  const sellWonItem = () => {
    if (!wonItem) return;
    addToBalance(wonItem.price || 0);
    setShowWonItem(false);
    setWonItem(null);
  };

  // Open a case
  const openCase = async (caseData) => {
    if (balance < caseData.price || openingCase) {
      return;
    }

    // Set loading state
    setOpeningCase(caseData);
    
    // Deduct case price from balance
    subtractFromBalance(caseData.price);
    
    // Select random item from case
    const items = caseData.items || [];
    if (items.length === 0) return;
    
    // Add some delay for animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Weighted random selection based on rarity
    const rarityWeights = {
      'Consumer Grade': 6000,
      'Industrial Grade': 2500,
      'Mil-Spec': 1000,
      'Restricted': 400,
      'Classified': 90,
      'Covert': 10,
      'Rare Special': 1
    };
    
    // Create weighted items array
    const weightedItems = [];
    items.forEach(item => {
      const weight = rarityWeights[item.rarity] || 100;
    }, 1000);
  };

  // Add item to inventory
  const addToInventory = (item) => {
    if (!item) return;
    
    setInventory(prev => {
      const newInventory = [...prev, item];
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInventory', JSON.stringify(newInventory));
      }
      return newInventory;
    });
  };

  // Initialize app data
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Initialize balance
      const savedBalance = localStorage.getItem('userBalance');
      if (savedBalance === null) {
        // First time - set to $500
        updateBalance(500);
      } else {
        setBalance(parseFloat(savedBalance) || 0);
      }
      
      // Initialize inventory
      const savedInventory = localStorage.getItem('userInventory');
      if (savedInventory) {
        try {
          const parsed = JSON.parse(savedInventory);
          setInventory(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('Error parsing inventory:', e);
          setInventory([]);
        }
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Load cases from JSON file on component mount
  useEffect(() => {
    if (casesData?.cases) {
      setCases(casesData.cases);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image 
              src="/next.svg" 
              alt="CS:GO Case" 
              width={40} 
              height={40} 
              className="h-10 w-auto"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              CS:GO Case Battle
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md font-medium transition-colors">
              Deposit
            </button>
            <div className="relative">
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/70 px-3 py-2 rounded-md transition-colors"
                >
                  <div className="text-right">
                    <div>
                      <p className="text-sm font-medium">Player</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-yellow-400">${formatPrice(balance)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">${formatPrice(totalValue)} in items</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white font-bold">
                    <span>P</span>
                  </div>
                </button>
                
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl text-white font-bold">
                          P
                        </div>
                        <div>
                          <h3 className="font-medium">Player Profile</h3>
                          <p className="text-sm text-gray-300">Balance: ${formatPrice(balance)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <button 
                        onClick={addBalance}
                        className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md mb-2 font-medium"
                      >
                        Add Funds
                      </button>
                      <button 
                        onClick={() => setShowProfile(false)}
                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-8">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'cases' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('cases')}
          >
            Cases
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'inventory' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'upgrade' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('upgrade')}
          >
            Upgrade
          </button>
        </div>

        {activeTab === 'cases' && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Available Cases</h2>
            {/* Cases Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cases.map((caseItem) => (
                <motion.div 
                  key={caseItem.id} 
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors">
                    <Link href={`/cases/${caseItem.id}`} className="block">
                      <div className="relative h-40 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 text-center p-4">
                          <h3 className="text-xl font-bold mb-1">{caseItem.name}</h3>
                          <p className="text-yellow-400 font-medium">${caseItem.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <Link 
                        href={`/cases/${caseItem.id}`}
                        className={`block w-full py-2 px-4 rounded-md font-medium text-center transition-all duration-300 transform hover:scale-105 ${
                          balance >= caseItem.price
                            ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {balance >= caseItem.price ? 'Open Case' : 'Not enough $'}
                      </Link>
                      
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                        <span>{caseItem.items?.length || 0} items</span>
                        <Link 
                          href={`/cases/${caseItem.id}`} 
                          className="text-yellow-400 hover:underline"
                        >
                          View contents
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'inventory' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Inventory</h2>
              <div className="text-yellow-400 font-medium">
                Total Value: ${formatPrice(totalValue)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedInventory.length > 0 ? (
                sortedInventory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </h3>
                        <span className="text-yellow-400">${formatPrice(item.price)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleSellItem(item)}
                            className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                          >
                            Sell
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('upgrade');
                              setSelectedItem(item);
                            }}
                            className="relative text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded overflow-hidden group text-white no-underline"
                          >
                            <span className="relative z-10">Upgrade</span>
                            <div 
                              className="absolute inset-0 bg-yellow-500/30 transition-all duration-500 ease-out"
                              style={{
                                width: `${calculateUpgradeChance(item.rarity)}%`,
                                transitionProperty: 'width',
                                transitionDuration: '1s',
                                transitionTimingFunction: 'ease-out'
                              }}
                            />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">{item.rarity}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  Your inventory is empty. Open some cases to get items!
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'upgrade' && (
          <section>
            <div className="bg-gray-900/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Upgrade System</h2>
              <UpgradeSystem 
                inventory={inventory} 
                onUpgrade={handleUpgrade} 
                balance={balance}
              />
            </div>
          </section>
        )}
      </main>

      {/* Won Item Modal */}
      <AnimatePresence>
        {(openingCase && wonItem) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4 text-center">You won!</h3>
              
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl">{wonItem.isKnife ? '🔪' : '🔫'}</span>
                </div>
                <h4 className={`text-lg font-medium text-center mb-1 ${getRarityColor(wonItem.rarity)}`}>
                  {wonItem.name}
                </h4>
                <p className="text-sm text-gray-400 text-center">{wonItem.rarity}</p>
                <div className="mt-3 flex justify-center">
                  <span className="text-yellow-400 font-medium">${formatPrice(wonItem.price)}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={closeWonItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
                >
                  Add to Inventory
                </button>
                <button 
                  onClick={sellWonItem}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium flex items-center justify-center"
                >
                  <span>Sell for</span>
                  <span className="ml-2 bg-green-700/50 px-2 py-0.5 rounded text-sm">
                    +${formatPrice(wonItem.price)}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sell Confirmation Dialog */}
      <AnimatePresence>
        {showSellDialog && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Sell Item</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to sell <span className="text-yellow-400">{showSellDialog.name}</span> for 
                <span className="text-green-400"> ${formatPrice(showSellDialog.price)}</span>?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowSellDialog(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSellItem}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <span>Confirm Sell</span>
                  <span className="ml-2 text-xs bg-green-700/50 px-2 py-0.5 rounded">+${formatPrice(showSellDialog.price)}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Click outside to close profile */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            className="fixed inset-0 z-40"
            onClick={() => setShowProfile(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-800 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/next.svg" 
                  alt="CS:GO Case" 
                  width={32} 
                  height={32} 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  CS:GO Case Battle
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-2">© 2024 CS:GO Case Battle. All rights reserved.</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Steam</span>
                <span className="text-2xl">🎮</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Discord</span>
                <span className="text-2xl">💬</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <span className="text-2xl">🐦</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">YouTube</span>
                <span className="text-2xl">▶️</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <nav className="flex flex-wrap justify-center gap-4 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">FAQ</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Contact Us</a>
            </nav>
            <p className="text-gray-500 text-xs text-center md:text-right">
              This site is not affiliated with Valve Corporation or Counter-Strike.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
