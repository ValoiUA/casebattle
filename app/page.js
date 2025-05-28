"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Calculate total inventory value
  const totalValue = inventory.reduce((sum, item) => sum + item.price, 0);
  // Sort inventory by price (highest first)
  const sortedInventory = [...inventory].sort((a, b) => b.price - a.price);
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

  // Format price with commas
  const formatPrice = (price) => {
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
      for (let i = 0; i < weight; i++) {
        weightedItems.push(item);
      }
    });
    
    // Select random item
    const selectedIndex = Math.floor(Math.random() * weightedItems.length);
    const selectedItem = { ...weightedItems[selectedIndex] };
    
    // Set the won item and show animation
    setWonItem(selectedItem);
    setShowWonItem(true);
    
    // Add to inventory
    addToInventory(selectedItem);
    
    // Reset opening state after animation
    setTimeout(() => {
      setOpeningCase(null);
    }, 1000);
  };

  // Add item to inventory
  const addToInventory = (item) => {
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
        updateBalance(500);se      } else {
        setBalance(parseFloat(savedBalance));
      }
      
      // Initialize inventory
      const savedInventory = localStorage.getItem('userInventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Load cases from JSON file on component mount
  useEffect(() => {
    setCases(casesData.cases);
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
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl text-white font-bold">
                        P
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Player</h3>
                        <p className="text-yellow-400 text-sm">${totalValue.toFixed(2)}</p>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded">
                            {inventory.length} items
                          </span>
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                            Level 1
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-700">
                    <button 
                      onClick={() => setActiveTab('inventory')}
                      className={`flex-1 py-3 text-sm font-medium ${activeTab === 'inventory' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      Inventory
                    </button>
                    <button 
                      onClick={() => setActiveTab('stats')}
                      className={`flex-1 py-3 text-sm font-medium ${activeTab === 'stats' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      Stats
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="max-h-96 overflow-y-auto">
                    {activeTab === 'inventory' ? (
                      <div>
                        {inventory.length > 0 ? (
                          <div className="divide-y divide-gray-700">
                            {inventory.map((item) => (
                              <div key={item.id} className="flex items-center p-3 hover:bg-gray-800/50 transition-colors">
                                <div className={`w-12 h-12 ${item.isKnife ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gray-700/50'} rounded flex items-center justify-center mr-3`}>
                                  <span className="text-2xl">{item.isKnife ? '🔪' : '🔫'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium truncate">{item.weapon}</p>
                                      <p className="text-xs text-gray-300 truncate">{item.skin}</p>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSellItem(item);
                                      }}
                                      className="ml-2 px-2 py-1 bg-red-600/50 hover:bg-red-600/70 text-white text-xs rounded transition-colors"
                                    >
                                      Sell
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      item.rarity === 'Covert' ? 'bg-red-900/50 text-red-300' :
                                      item.rarity === 'Classified' ? 'bg-purple-900/50 text-purple-300' :
                                      item.rarity === 'Rare Special' ? 'bg-amber-900/50 text-amber-300' :
                                      'bg-gray-700/50 text-gray-300'
                                    }`}>
                                      {item.rarity}
                                    </span>
                                    <span className="text-xs font-medium text-yellow-400">${formatPrice(item.price)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-2xl">📦</span>
                            </div>
                            <h4 className="font-medium mb-1">Your inventory is empty</h4>
                            <p className="text-sm text-gray-400 mb-4">Open cases to get items</p>
                            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-medium">
                              Open Cases
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4">
                        <h4 className="font-medium mb-3">Your Stats</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Total Value</span>
                              <span className="font-medium">${formatPrice(balance)}</span>
                            </div>
                            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500" 
                                style={{ width: `${Math.min(100, (totalValue / 10000) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-800/50 p-3 rounded">
                              <p className="text-gray-400">Items Owned</p>
                              <p className="text-lg font-bold">{inventory.length}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded">
                              <p className="text-gray-400">Most Valuable</p>
                              <p className="text-sm font-medium truncate">
                                {inventory.length > 0 ? inventory[0].name : 'None'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Cases Section */}
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
