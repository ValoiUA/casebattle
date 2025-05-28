"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpgradeSystem({ inventory, onUpgrade, onSell, balance }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [upgradeType, setUpgradeType] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Filter items that can be upgraded (price > 1)
  const upgradeableItems = inventory.filter(item => item.price > 1);

  const handleUpgrade = (type) => {
    if (!selectedItem || isUpgrading) return;
    
    setIsUpgrading(true);
    setUpgradeType(type);
    
    // Simulate API call delay
    setTimeout(() => {
      const isSuccess = Math.random() < (type === '2x' ? 0.3 : 0.05);
      const result = {
        success: isSuccess,
        originalItem: selectedItem,
        newItem: isSuccess 
          ? { ...selectedItem, price: selectedItem.price * (type === '2x' ? 2 : 10) }
          : null
      };
      
      setUpgradeResult(result);
      setShowResult(true);
      setIsUpgrading(false);
      
      if (isSuccess) {
        onUpgrade(selectedItem, result.newItem);
      }
    }, 1500);
  };

  const closeResult = () => {
    setShowResult(false);
    setUpgradeResult(null);
    setSelectedItem(null);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Upgrade System</h2>
      
      {!selectedItem ? (
        <div>
          <p className="text-gray-300 mb-4">Select an item to upgrade:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upgradeableItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-green-400">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {upgradeableItems.length === 0 && (
            <p className="text-gray-400 text-center py-4">No upgradeable items in your inventory.</p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Selected: {selectedItem.name}</h3>
          <p className="text-gray-300 mb-6">Current Value: ${selectedItem.price.toFixed(2)}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all ${isUpgrading ? 'opacity-50' : 'hover:bg-opacity-80'}`}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}
              onClick={() => !isUpgrading && handleUpgrade('2x')}
            >
              <h4 className="font-bold text-white text-lg">2x Upgrade</h4>
              <p className="text-blue-200">30% Success Chance</p>
              <p className="text-white font-medium mt-2">${(selectedItem.price * 2).toFixed(2)} Potential</p>
            </div>
            
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all ${isUpgrading ? 'opacity-50' : 'hover:bg-opacity-80'}`}
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              onClick={() => !isUpgrading && handleUpgrade('10x')}
            >
              <h4 className="font-bold text-white text-lg">10x Upgrade</h4>
              <p className="text-purple-200">5% Success Chance</p>
              <p className="text-white font-medium mt-2">${(selectedItem.price * 10).toFixed(2)} Potential</p>
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedItem(null)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            disabled={isUpgrading}
          >
            Back to Items
          </button>
        </div>
      )}
      
      <AnimatePresence>
        {showResult && upgradeResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-opacity-50 border-yellow-500">
              <h3 className="text-2xl font-bold text-center mb-4">
                {upgradeResult.success ? 'Upgrade Successful!' : 'Upgrade Failed'}
              </h3>
              
              <div className="flex justify-between items-center my-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xs text-gray-400">{upgradeResult.originalItem.name}</span>
                  </div>
                  <p className="text-gray-300 text-sm">${upgradeResult.originalItem.price.toFixed(2)}</p>
                </div>
                
                <div className="text-3xl text-yellow-400">→</div>
                
                <div className="text-center">
                  {upgradeResult.success ? (
                    <div className="w-20 h-20 bg-green-900 bg-opacity-50 border-2 border-green-500 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs text-white">{upgradeResult.newItem.name}</span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-800 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-3xl">❌</span>
                    </div>
                  )}
                  <p className={upgradeResult.success ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {upgradeResult.success ? `$${upgradeResult.newItem.price.toFixed(2)}` : 'Lost Item'}
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button 
                  onClick={closeResult}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {upgradeResult.success ? 'Awesome!' : 'Try Again'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
