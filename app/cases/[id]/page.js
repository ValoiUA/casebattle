'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// Import the cases data
import casesData from '../../../app/data/cases.json';

// This is a client component that will receive the case data as props
export default function CasePage({ params: paramsPromise }) {
  const router = useRouter();
  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [wonItem, setWonItem] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [items, setItems] = useState([]);
  const [caseId, setCaseId] = useState(null);

  // Handle params promise
  useEffect(() => {
    let isMounted = true;

    const loadParams = async () => {
      try {
        // Unwrap the params promise
        const params = await Promise.resolve(paramsPromise);
        if (!isMounted) return;

        // Get the case ID safely
        const idParam = params?.id;
        if (!idParam) {
          setError('No case ID provided');
          setIsLoading(false);
          return;
        }

        // Handle both array and string params
        const id = Array.isArray(idParam) ? idParam[0] : idParam;
        setCaseId(id);
      } catch (err) {
        console.error('Error loading params:', err);
        setError('Failed to load case');
        setIsLoading(false);
      }
    };

    loadParams();

    return () => {
      isMounted = false;
    };
  }, [paramsPromise]);

  // Load case data when caseId changes
  useEffect(() => {
    if (!caseId) return;

    const foundCase = casesData.cases.find(c => c.id.toString() === caseId);
    
    if (foundCase) {
      setCaseData(foundCase);
      // Create array of all items for animation
      const allItems = [];
      foundCase.skins.forEach(item => {
        // Add multiple instances of each item based on rarity for better distribution
        const count = item.rarity === 'Covert' ? 1 :
                     item.rarity === 'Classified' ? 3 :
                     item.rarity === 'Restricted' ? 8 :
                     item.rarity === 'Mil-Spec' ? 20 :
                     item.rarity === 'Industrial Grade' ? 50 : 100;
        
        for (let i = 0; i < count; i++) {
          allItems.push({ ...item, id: `${item.name}-${i}` });
        }
      });
      
      // Shuffle items
      setItems(allItems.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    } else {
      setError('Case not found');
      setIsLoading(false);
    }
  }, [caseId]);
  
  const openCase = () => {
    if (!caseData || opening) return;
    
    setOpening(true);
    setShowResult(false);
    
    // Reset scroll position
    const container = document.getElementById('items-container');
    if (container) {
      container.scrollLeft = 0;
    }
    
    // Simulate spinning animation with easing
    const spinDuration = 4000; // 4 seconds of spinning (increased for better effect)
    const startTime = Date.now();
    let lastTime = startTime;
    let scrollSpeed = 5;
    let maxSpeed = 30;
    
    const spin = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const delta = now - lastTime;
      lastTime = now;
      
      if (elapsed < spinDuration) {
        // Ease-in-out effect
        const progress = elapsed / spinDuration;
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Gradually increase then decrease speed
        if (progress < 0.8) {
          scrollSpeed = 5 + (maxSpeed - 5) * easeProgress / 0.8;
        } else {
          scrollSpeed = maxSpeed * (1 - (progress - 0.8) / 0.2);
        }
        
        // Scroll through items
        if (container) {
          container.scrollLeft = (container.scrollLeft + scrollSpeed) % container.scrollWidth;
        }
        
        requestAnimationFrame(spin);
      } else {
        // Select random item (weighted by rarity)
        const randomIndex = Math.floor(Math.random() * items.length);
        const selected = items[randomIndex];
        
        // Scroll to the selected item
        if (container) {
          const itemWidth = 96; // 6rem = 96px (w-24)
          const targetScroll = randomIndex * itemWidth - (container.clientWidth / 2) + (itemWidth / 2);
          container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        }
        
        // Show result with a slight delay
        setTimeout(() => {
          setWonItem(selected);
          setShowResult(true);
          setOpening(false);
          
          // Add to inventory
          const inventory = JSON.parse(localStorage.getItem('userInventory') || '[]');
          inventory.push({ ...selected, id: Date.now() });
          localStorage.setItem('userInventory', JSON.stringify(inventory));
          
          // Update balance
          const balance = parseFloat(localStorage.getItem('userBalance') || '0');
          localStorage.setItem('userBalance', (balance - caseData.price).toString());
        }, 1000);
      }
    };
    
    // Start the animation
    requestAnimationFrame(spin);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Case not found</h1>
          <Link href="/" className="text-yellow-400 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Case not found'}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="md:mr-8 mb-6 md:mb-0">
                  <div className="w-48 h-48 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-lg flex items-center justify-center text-6xl">
                    {opening ? '🎲' : '📦'}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{caseData.name}</h1>
                  <p className="text-yellow-400 text-xl font-medium mb-4">${caseData.price.toFixed(2)}</p>
                  
                  <AnimatePresence>
                    {showResult && wonItem && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-500/50"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-3xl">{wonItem.isKnife ? '🔪' : '🔫'}</span>
                          <div>
                            <p className="font-medium">{wonItem.name}</p>
                            <p className={`text-sm ${getRarityColor(wonItem.rarity)}`}>
                              {wonItem.rarity} • ${wonItem.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <button 
                    onClick={openCase}
                    disabled={opening}
                    className={`px-6 py-3 rounded-md font-medium text-lg w-full md:w-auto transition-all ${
                      opening 
                        ? 'bg-yellow-700 cursor-wait' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {opening ? 'Opening...' : `Open Case ($${caseData.price.toFixed(2)})`}
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {opening ? 'Spinning...' : 'Possible Drops'}
                </h2>
                
                <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-800/50 p-2">
                  <div 
                    id="items-container"
                    className="flex h-full space-x-4 overflow-x-auto scrollbar-hide"
                    style={{ scrollBehavior: opening ? 'auto' : 'smooth' }}
                  >
                    {items.map((item, index) => (
                      <motion.div 
                        key={`${item.id}-${index}`}
                        className={`flex-shrink-0 w-24 h-full rounded-md border-2 flex flex-col items-center justify-center ${
                          wonItem?.name === item.name && showResult 
                            ? 'border-yellow-400 shadow-lg shadow-yellow-500/30 scale-110 z-10' 
                            : 'border-transparent'
                        } ${getRarityColor(item.rarity).replace('text', 'bg').replace('400', '900/50')} p-2 transition-all duration-300`}
                        initial={{ opacity: 0.8, y: 10 }}
                        animate={{ 
                          opacity: wonItem?.name === item.name && showResult ? 1 : 0.8,
                          y: wonItem?.name === item.name && showResult ? 0 : 10,
                          scale: wonItem?.name === item.name && showResult ? 1.1 : 1
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-3xl mb-1">
                          {item.weapon === 'Knife' ? '🔪' : '🔫'}
                        </div>
                        <div className="text-xs text-center font-medium truncate w-full">
                          {item.weapon}
                        </div>
                        <div className="text-xs text-gray-300 truncate w-full text-center">
                          {item.skin}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Gradient overlays for better visual effect */}
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
                </div>
                
                {!opening && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...new Set(caseData.skins.map(i => i.rarity))].map((rarity, i) => (
                      <div key={i} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${getRarityColor(rarity)}`}></span>
                        <span className="text-sm text-gray-300">{rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
            >
              ← Back to All Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
