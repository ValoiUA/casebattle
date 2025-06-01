'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function UpgradePage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [upgrading, setUpgrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [manualChance, setManualChance] = useState(50);
  const [upgradeChance, setUpgradeChance] = useState(0);
  const searchParams = useSearchParams();

  // Load inventory from localStorage and handle URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadInventory = () => {
        const savedInventory = localStorage.getItem('userInventory');
        if (savedInventory) {
          try {
            const parsedInventory = JSON.parse(savedInventory);
            setInventory(parsedInventory);
            
            // Check for item IDs in URL
            const itemIds = searchParams.getAll('itemId');
            if (itemIds.length > 0) {
              const items = parsedInventory.filter(item => itemIds.includes(item.id));
              setSelectedItems(items);
            }
          } catch (e) {
            console.error('Failed to parse inventory', e);
          }
        }
      };
      
      loadInventory();
      
      // Listen for storage changes to update the inventory
      const handleStorageChange = () => {
        loadInventory();
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [searchParams]);
  
  // Calculate upgrade chance based on selected items or use manual chance
  useEffect(() => {
    let chance = 0;
    
    if (selectedItems.length === 0) {
      chance = 0;
    } else if (selectedItems.length === 1) {
      // Use manual chance for single item
      chance = manualChance;
    } else {
      // Calculate average chance for multiple items
      const totalChance = selectedItems.reduce((sum, item) => {
        return sum + calculateUpgradeChance(item.rarity);
      }, 0);
      chance = Math.round(totalChance / selectedItems.length);
    }
    
    setUpgradeChance(chance);
  }, [selectedItems, manualChance]);
  
  // Toggle item selection
  const toggleItemSelection = useCallback((item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

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
    return rarityChances[rarity] || 50;
  };

  // Get next rarity
  const getNextRarity = (currentRarity) => {
    const rarityOrder = [
      'Consumer Grade',
      'Industrial Grade',
      'Mil-Spec',
      'Restricted',
      'Classified',
      'Covert',
      'Rare Special'
    ];
    const currentIndex = rarityOrder.indexOf(currentRarity);
    return currentIndex < rarityOrder.length - 1 ? rarityOrder[currentIndex + 1] : null;
  };

  // Handle upgrade for multiple items
  const handleUpgrade = () => {
    if (selectedItems.length === 0) return;
    
    setUpgrading(true);
    
    // Calculate success based on average chance
    const isSuccess = Math.random() * 100 < upgradeChance;
    
    // Simulate upgrade animation
    setTimeout(() => {
      const newInventory = [...inventory];
      const results = [];
      
      if (isSuccess) {
        // On success: upgrade the first item, remove others
        const itemToUpgrade = selectedItems[0];
        const newRarity = getNextRarity(itemToUpgrade.rarity);
        const newPrice = Math.floor(itemToUpgrade.price * 2.5);
        
        const upgradedItem = {
          ...itemToUpgrade,
          rarity: newRarity,
          price: newPrice,
          upgradedFrom: itemToUpgrade.rarity,
          upgradedAt: new Date().toISOString()
        };
        
        // Update the item in inventory
        const itemIndex = newInventory.findIndex(i => i.id === itemToUpgrade.id);
        if (itemIndex !== -1) {
          newInventory[itemIndex] = upgradedItem;
        }
        
        // Remove other selected items
        const itemsToRemove = selectedItems.filter(item => item.id !== itemToUpgrade.id);
        const updatedInventory = newInventory.filter(
          item => !itemsToRemove.some(removed => removed.id === item.id)
        );
        
        setInventory(updatedInventory);
        localStorage.setItem('userInventory', JSON.stringify(updatedInventory));
        
        // Set success result
        setUpgradeResult({
          success: true,
          item: upgradedItem,
          oldRarity: itemToUpgrade.rarity,
          newRarity,
          itemsLost: itemsToRemove,
          message: `Successfully upgraded to ${newRarity}!`
        });
      } else {
        // On failure: remove 1-3 random selected items
        const itemsToRemove = [...selectedItems]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(selectedItems.length, 3));
        
        const updatedInventory = newInventory.filter(
          item => !itemsToRemove.some(removed => removed.id === item.id)
        );
        
        setInventory(updatedInventory);
        localStorage.setItem('userInventory', JSON.stringify(updatedInventory));
        
        // Set failure result
        setUpgradeResult({
          success: false,
          itemsLost: itemsToRemove,
          message: `Upgrade failed! ${itemsToRemove.length} item${itemsToRemove.length > 1 ? 's were' : ' was'} lost.`
        });
      }
      
      setShowResult(true);
      setUpgrading(false);
      setSelectedItems([]);
    }, 3000); // 3 seconds for animation
  };

  // Close result and reset
  const closeResult = () => {
    setShowResult(false);
    setUpgradeResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Upgrade System</h1>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            Back to Inventory
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left side - Inventory */}
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Inventory</h2>
              {selectedItems.length > 0 && (
                <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {inventory.length > 0 ? (
                inventory.map((item) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => !upgrading && toggleItemSelection(item)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-900/50 border-2 border-blue-500 scale-[1.02]' 
                          : 'bg-gray-700/50 hover:bg-gray-700 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                          }`}>
                            {isSelected && (
                              <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className={`text-sm ${getRarityColor(item.rarity)}`}>
                              {item.rarity}
                            </p>
                          </div>
                        </div>
                        <span className="text-yellow-400">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400">Your inventory is empty</p>
              )}
            </div>
          </div>
          
          {/* Middle - Upgrade Machine */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md bg-gray-800/70 rounded-xl border-2 border-gray-700 p-6">
              {selectedItems.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium text-center">
                      Selected Items ({selectedItems.length})
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-gray-700/30 rounded-lg">
                      {selectedItems.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="relative bg-gray-700/50 p-2 rounded-lg flex items-center space-x-2"
                        >
                          <div className="w-8 h-8 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className={`text-xs ${getRarityColor(item.rarity)}`}>
                              {item.rarity}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemSelection(item);
                            }}
                            className="ml-auto text-gray-400 hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Success Chance:</span>
                        <span className="text-xl font-bold text-yellow-400">{upgradeChance}%</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>On failure: {Math.min(selectedItems.length, 3)} random items will be lost</p>
                      </div>
                    </div>
                  </div>
                  
                  {upgrading ? (
                    <div className="w-full mt-4">
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3, ease: 'linear' }}
                        />
                      </div>
                      <p className="text-center mt-2 text-yellow-400">Upgrading...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpgrade}
                      disabled={selectedItems.length === 0 || upgrading}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        selectedItems.length > 0 && !upgrading
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {upgrading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Upgrading...
                        </span>
                      ) : (
                        `Upgrade (${upgradeChance}% Chance)`
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <svg 
                    className="w-12 h-12 mx-auto mb-4 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Select items from your inventory to upgrade</p>
                  <p className="text-sm mt-1">Select 1 or more items to begin</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Next Rarity */}
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Next Rarity</h2>
            {selectedItems.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Upgrade Items</h1>
                  <div className="text-yellow-400">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
                
                {/* Manual Chance Input */}
                {selectedItems.length === 1 && (
                  <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Manual Success Chance: {manualChance}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={manualChance}
                      onChange={(e) => setManualChance(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="font-medium">Selected Items</h3>
                  <p className="text-yellow-400">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
                  {selectedItems.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedItems.slice(0, 4).map((item, index) => (
                        <div key={index} className="text-xs bg-gray-600/50 p-1 rounded truncate">
                          {item.name}
                        </div>
                      ))}
                      {selectedItems.length > 4 && (
                        <div className="text-xs bg-gray-600/50 p-1 rounded text-center">
                          +{selectedItems.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 mx-auto my-2 text-yellow-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <p className="text-sm text-gray-400">Upgrade chance</p>
                </div>
                
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                  <h3 className="font-medium text-blue-400">Success Chance</h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {upgradeChance}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Based on average rarity of selected items
                  </p>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="font-medium">On Failure</h3>
                  <p className="text-red-400">
                    {selectedItems.length === 1 
                      ? 'The item will be lost'
                      : `${Math.min(selectedItems.length, 3)} random item${selectedItems.length > 1 ? 's' : ''} will be lost`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 mx-auto mb-2 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>Select items to see upgrade details</p>
                <p className="text-sm mt-1">Select 2 or more items to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Upgrade Result Modal */}
      <AnimatePresence>
        {showResult && upgradeResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 relative overflow-y-auto max-h-[90vh]"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${
                upgradeResult.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  {upgradeResult.success ? '✨ Upgrade Successful! ✨' : '❌ Upgrade Failed'}
                </h2>
                
                {upgradeResult.success ? (
                  <>
                    <div className="relative w-40 h-40 mx-auto mb-6 bg-gray-700/50 rounded-lg flex items-center justify-center">
                      {upgradeResult.item.image && upgradeResult.item.image.startsWith('http') ? (
                        <Image
                          src={upgradeResult.item.image}
                          alt={upgradeResult.item.name}
                          fill
                          className="object-contain p-2"
                          unoptimized={process.env.NODE_ENV !== 'production'}
                        />
                      ) : (
                        <div className="text-gray-400 text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">No preview</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-medium">{upgradeResult.item.name}</h3>
                    
                    <div className="flex justify-center items-center my-4 space-x-4">
                      <span className="text-gray-400 line-through">
                        {upgradeResult.oldRarity}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6 text-yellow-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className={getRarityColor(upgradeResult.newRarity)}>
                        {upgradeResult.newRarity}
                      </span>
                    </div>
                    
                    <p className="text-green-400 mb-2">
                      New Value: ${Math.floor(upgradeResult.item.price * 2.5).toFixed(2)}
                    </p>
                    
                    {upgradeResult.itemsLost && upgradeResult.itemsLost.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Items used in upgrade:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {upgradeResult.itemsLost.map((item, index) => (
                            <div key={index} className="bg-gray-700/50 p-2 rounded text-xs">
                              <p className="truncate">{item.name}</p>
                              <p className={getRarityColor(item.rarity)}>{item.rarity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <svg 
                        className="w-16 h-16 mx-auto text-red-500 mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-red-400 text-lg font-medium mb-2">
                        {upgradeResult.message}
                      </p>
                      
                      {upgradeResult.itemsLost && upgradeResult.itemsLost.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Items lost:</p>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {upgradeResult.itemsLost.map((item, index) => (
                              <div key={index} className="bg-gray-700/50 p-2 rounded text-xs">
                                <p className="truncate">{item.name}</p>
                                <p className={getRarityColor(item.rarity)}>{item.rarity}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <button
                  onClick={closeResult}
                  className={`mt-6 px-6 py-2 rounded-md font-medium w-full ${
                    upgradeResult.success 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {upgradeResult.success ? 'Continue' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get rarity color
function getRarityColor(rarity) {
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
}
