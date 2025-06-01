'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Import the cases data
import casesData from '../../../app/data/cases.json';

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
  const [spinningPhase, setSpinningPhase] = useState('ready');

  useEffect(() => {
    let isMounted = true;

    const loadParams = async () => {
      try {
        const params = await Promise.resolve(paramsPromise);
        if (!isMounted) return;

        const idParam = params?.id;
        if (!idParam) {
          setError('No case ID provided');
          setIsLoading(false);
          return;
        }

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

  useEffect(() => {
    if (!caseId) return;

    setIsLoading(true);
    setError('');
    
    try {
      const foundCase = casesData.cases.find(c => c.id.toString() === caseId);
      
      if (foundCase) {
        setCaseData(foundCase);
        const allItems = [];
        foundCase.skins.forEach(item => {
          const count = item.rarity === 'Covert' ? 1 :
                       item.rarity === 'Classified' ? 3 :
                       item.rarity === 'Restricted' ? 8 :
                       item.rarity === 'Mil-Spec' ? 20 :
                       item.rarity === 'Industrial Grade' ? 50 : 100;
          
          for (let i = 0; i < count; i++) {
            allItems.push({ ...item, id: `${item.name}-${i}` });
          }
        });
        
        setItems(allItems.sort(() => Math.random() - 0.5));
      } else {
        setError('Case not found');
      }
    } catch (err) {
      console.error('Error loading case data:', err);
      setError('Failed to load case data');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);
  
  const openCase = () => {
    if (!caseData || opening) return;
    
    setOpening(true);
    setShowResult(false);
    setSpinningPhase('accelerating');
    
    const container = document.getElementById('items-container');
    if (container) {
      container.scrollLeft = 0;
    }
    
    const spinDuration = 6000; // Slightly longer for more dramatic effect
    const accelerationDuration = 2500;
    const decelerationStart = spinDuration - 2000;
    
    let startTime = Date.now();
    let lastTime = startTime;
    let scrollSpeed = 0;
    let maxSpeed = 80; // Higher max speed for more excitement
    let selectedItemIndex = Math.floor(Math.random() * items.length);
    const selectedItem = items[selectedItemIndex];
    let lastScrollPosition = 0;
    let direction = 1; // 1 for right, -1 for left
    let directionChangeTimer = 0;
    
    // Add subtle sound effects (optional)
    const playSound = (type) => {
      // This is a placeholder - you'll need to implement actual sound playing
      // For example: new Audio(`/sounds/${type}.mp3`).play().catch(() => {});
    };
    
    const spin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      if (elapsed < spinDuration) {
        // Acceleration phase
        if (elapsed < accelerationDuration) {
          const progress = elapsed / accelerationDuration;
          // Ease out cubic for smooth acceleration
          scrollSpeed = maxSpeed * (1 - Math.pow(1 - progress, 3));
          setSpinningPhase('accelerating');
          
          // Change direction occasionally during acceleration for a more dynamic feel
          if (elapsed - directionChangeTimer > 500) {
            direction = Math.random() > 0.7 ? -direction : direction;
            directionChangeTimer = elapsed;
          }
        } 
        // Deceleration phase
        else if (elapsed > decelerationStart) {
          const progress = (elapsed - decelerationStart) / (spinDuration - decelerationStart);
          // Ease in cubic for smooth deceleration
          scrollSpeed = maxSpeed * (1 - progress * progress * progress);
          setSpinningPhase('decelerating');
        } 
        // Constant speed phase
        else {
          scrollSpeed = maxSpeed;
          setSpinningPhase('constant');
        }
        
        if (container) {
          // Add subtle vertical movement
          const verticalMovement = Math.sin(elapsed * 0.01) * 5;
          container.style.transform = `translateY(${verticalMovement}px)`;
          
          // Apply scroll with direction
          const newScroll = (container.scrollLeft + scrollSpeed * direction) % container.scrollWidth;
          container.scrollLeft = newScroll;
          
          // Add momentum effect when changing direction
          if (Math.sign(newScroll - lastScrollPosition) !== direction) {
            direction = -direction;
            playSound('tick');
          }
          lastScrollPosition = newScroll;
        }
        
        requestAnimationFrame(spin);
      } else {
        // Final positioning
        setSpinningPhase('stopping');
        
        if (container) {
          // Reset transform
          container.style.transform = 'translateY(0)';
          
          // Calculate final position with the selected item centered
          const itemWidth = 112; // Slightly larger for better visibility
          const containerCenter = container.clientWidth / 2;
          const targetScroll = Math.max(0, selectedItemIndex * itemWidth - containerCenter + (itemWidth / 2));
          
          // Add a slight bounce effect
          container.style.scrollBehavior = 'smooth';
          container.scrollLeft = targetScroll + 30; // Overshoot
          
          setTimeout(() => {
            container.scrollLeft = targetScroll - 15; // Bounce back
            
            setTimeout(() => {
              container.scrollLeft = targetScroll; // Final position
              
              // Show the won item with a delay
              setTimeout(() => {
                setWonItem(selectedItem);
                setShowResult(true);
                setOpening(false);
                setSpinningPhase('ready');
                playSound('win');
                
                // Update user's inventory and balance
                const inventory = JSON.parse(localStorage.getItem('userInventory') || '[]');
                inventory.push({ ...selectedItem, id: Date.now() });
                localStorage.setItem('userInventory', JSON.stringify(inventory));
                
                const balance = parseFloat(localStorage.getItem('userBalance') || '0');
                localStorage.setItem('userBalance', (balance - caseData.price).toString());
                
                // Trigger confetti effect for rare items
                if (['Covert', 'Rare Special', 'Classified'].includes(selectedItem.rarity)) {
                  triggerConfetti();
                }
              }, 500);
            }, 100);
          }, 100);
        }
      }
    };
    
    // Start with a small delay to allow UI to update
    setTimeout(() => {
      playSound('start');
      requestAnimationFrame(spin);
    }, 300);
  };
  
  // Confetti effect for rare items
  const triggerConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confettiPieces = 150;
    const container = document.getElementById('confetti-container');
    
    for (let i = 0; i < confettiPieces; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
      confetti.style.setProperty('--random-x', (Math.random() * 200 - 100) + 'px');
      container?.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  };

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

  const getRarityBgColor = (rarity) => {
    switch(rarity) {
      case 'Covert': return 'bg-red-900/50 border-red-500/50';
      case 'Classified': return 'bg-purple-900/50 border-purple-500/50';
      case 'Restricted': return 'bg-blue-900/50 border-blue-500/50';
      case 'Mil-Spec': return 'bg-sky-900/50 border-sky-500/50';
      case 'Industrial Grade': return 'bg-teal-900/50 border-teal-500/50';
      case 'Consumer Grade': return 'bg-gray-900/50 border-gray-500/50';
      case 'Rare Special': return 'bg-yellow-900/50 border-yellow-500/50';
      default: return 'bg-gray-900/50 border-gray-500/50';
    }
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

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Case not found'}</h1>
          <Link href="/" className="text-yellow-400 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 relative overflow-hidden">
      {/* Confetti container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50 overflow-hidden"></div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-radial-gradient from-yellow-500/10 to-transparent opacity-0 transition-opacity duration-1000 pointer-events-none" 
           style={{ opacity: opening ? 0.5 : 0 }}></div>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="md:mr-8 mb-6 md:mb-0">
                  <motion.div 
                    className="w-48 h-48 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-lg flex items-center justify-center text-6xl"
                    animate={{
                      rotate: opening ? [0, 10, -10, 0] : 0,
                      scale: opening ? [1, 1.05, 1] : 1,
                      y: opening ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: opening ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    {opening ? (
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        🎲
                      </motion.div>
                    ) : (
                      '📦'
                    )}
                  </motion.div>
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{caseData?.name || 'Unknown Case'}</h1>
                  <p className="text-yellow-400 text-xl font-medium mb-4">${caseData?.price?.toFixed(2) || '0.00'}</p>
                  
                  <AnimatePresence>
                    {showResult && wonItem && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          scale: [1, 1.05, 1],
                          backgroundColor: ['rgba(55, 65, 81, 0.5)', 'rgba(234, 179, 8, 0.2)', 'rgba(55, 65, 81, 0.5)']
                        }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 p-4 rounded-lg border border-yellow-500/50"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <motion.span 
                            className="text-3xl"
                            animate={{
                              rotate: [0, 15, -15, 0],
                              y: [0, -5, 5, 0],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 0.5, repeat: 2 }}
                          >
                            {wonItem.isKnife ? '🔪' : '🔫'}
                          </motion.span>
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
                  
                  <motion.button 
                    onClick={openCase}
                    disabled={opening}
                    whileHover={!opening ? { scale: 1.05 } : {}}
                    whileTap={!opening ? { scale: 0.95 } : {}}
                    className={`px-6 py-3 rounded-md font-medium text-lg w-full md:w-auto ${
                      opening 
                        ? 'bg-yellow-700 cursor-wait' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                    animate={{
                      y: opening ? [0, -2, 2, 0] : 0,
                      scale: opening ? [1, 1.02, 1] : 1
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: opening ? Infinity : 0
                    }}
                  >
                    {opening ? (
                      <span className="flex items-center justify-center">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block mr-2"
                        >
                          🌀
                        </motion.span>
                        Opening...
                      </span>
                    ) : (
                      `Open Case ($${caseData?.price?.toFixed(2) || '0.00'})`
                    )}
                  </motion.button>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {opening ? (
                    <motion.div
                      animate={{ 
                        opacity: [0.8, 1, 0.8],
                        x: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {spinningPhase === 'accelerating' && 'Spinning up...'}
                      {spinningPhase === 'constant' && 'Spinning...'}
                      {spinningPhase === 'decelerating' && 'Slowing down...'}
                      {spinningPhase === 'stopping' && 'Almost there...'}
                    </motion.div>
                  ) : 'Possible Drops'}
                </h2>
                
                <motion.div 
                  className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-800/30 p-3 border border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    borderColor: opening ? 'rgba(234, 179, 8, 0.3)' : 'rgba(55, 65, 81, 0.5)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    id="items-container"
                    className="flex h-full space-x-6 overflow-x-auto scrollbar-hide"
                    style={{ 
                      scrollBehavior: opening ? 'auto' : 'smooth',
                      transition: 'transform 0.2s ease-out'
                    }}
                  >
                    {items.map((item, index) => (
                      <motion.div 
                        key={`${item.id}-${index}`}
                        className={`flex-shrink-0 w-28 h-full rounded-lg border-2 flex flex-col items-center justify-center transform transition-all duration-300 ${
                      wonItem?.name === item.name && showResult 
                        ? 'border-yellow-400 shadow-xl shadow-yellow-500/50 scale-125 z-20' 
                        : 'border-transparent hover:border-yellow-500/30 hover:scale-105 hover:z-10'
                    } ${getRarityBgColor(item.rarity)} p-3 relative overflow-hidden group`}
                    style={{
                      boxShadow: wonItem?.name === item.name && showResult 
                        ? '0 0 30px rgba(234, 179, 8, 0.7)' 
                        : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                        initial={{ opacity: 0.8, y: 10 }}
                        animate={{ 
                          opacity: wonItem?.name === item.name && showResult ? 1 : 0.8,
                          y: wonItem?.name === item.name && showResult ? 0 : 10,
                          scale: wonItem?.name === item.name && showResult ? 1.1 : 1,
{{ ... }}
                            ? '0 0 20px rgba(234, 179, 8, 0.5)' 
                            : 'none'
                        }}
                        transition={{ duration: 0.3 }}
                        whileHover={!opening ? { y: 0, opacity: 1, scale: 1.05 } : {}}
                      >
                        <motion.div 
                          className="text-3xl mb-1"
                          animate={{
                            rotate: opening ? [0, 5, -5, 0] : 0,
                            y: opening ? [0, 2, -2, 0] : 0
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: opening ? Infinity : 0
                          }}
                        >
                          <motion.span
                            animate={{
                              y: [0, -5, 0],
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="inline-block"
                          >
                            {item.weapon === 'Knife' ? '🔪' : '🔫'}
                          </motion.span>
                        </motion.div>
                        <div className="text-xs text-center font-medium truncate w-full">
                          {item.weapon}
                        </div>
                        <div className="text-xs text-gray-300 truncate w-full text-center">
                          {item.skin}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div 
                    className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"
                    animate={{
                      opacity: opening ? [0.7, 0.9, 0.7] : 0.7
                    }}
                    transition={{
                      duration: 2,
                      repeat: opening ? Infinity : 0
                    }}
                  ></motion.div>
                  <motion.div 
                    className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"
                    animate={{
                      opacity: opening ? [0.7, 0.9, 0.7] : 0.7
                    }}
                    transition={{
                      duration: 2,
                      repeat: opening ? Infinity : 0,
                      delay: 0.5
                    }}
                  ></motion.div>
                  
                  {opening && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="w-16 h-16 rounded-full border-4 border-dashed border-yellow-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      ></motion.div>
                    </motion.div>
                  )}
                </div>
                
                {!opening && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {[...new Set(caseData.skins.map(i => i.rarity))].sort((a, b) => {
                      const order = ['Covert', 'Classified', 'Restricted', 'Mil-Spec', 'Industrial Grade', 'Consumer Grade'];
                      return order.indexOf(a) - order.indexOf(b);
                    }).map((rarity, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className={`w-3 h-3 rounded-full mr-2 ${getRarityColor(rarity)}`}></span>
                        <span className="text-sm text-gray-300">{rarity}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
            >
              ← Back to All Cases
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}