"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaTimes, FaCheck } from 'react-icons/fa';

// Конфігурація рідкостей
const RARITIES = [
  'Consumer Grade',
  'Industrial Grade',
  'Mil-Spec',
  'Restricted',
  'Classified',
  'Covert',
  'Rare Special Item'
];

const RARITY_COLORS = {
  'Consumer Grade': 'from-gray-500 to-gray-600',
  'Industrial Grade': 'from-blue-500 to-blue-600',
  'Mil-Spec': 'from-blue-400 to-blue-500',
  'Restricted': 'from-purple-500 to-purple-600',
  'Classified': 'from-pink-500 to-pink-600',
  'Covert': 'from-red-500 to-red-600',
  'Rare Special Item': 'from-yellow-400 to-yellow-500'
};

// Компонент для відображення рідкості
const RarityBadge = ({ rarity, size = 'md' }) => (
  <span 
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${RARITY_COLORS[rarity] || 'bg-gray-700'} text-white ${
      size === 'sm' ? 'text-xs px-2 py-0.5' : ''
    }`}
  >
    {rarity}
  </span>
);

export default function UpgradeSystem({ inventory, onUpgrade, onSell, balance }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  // Отримуємо наступну рідкість
  const getNextRarity = (currentRarity) => {
    const currentIndex = RARITIES.indexOf(currentRarity);
    return RARITIES[Math.min(currentIndex + 1, RARITIES.length - 1)];
  };

  // Розраховуємо шанс апгрейду
  const getUpgradeChance = (currentRarity, multiplier = 1) => {
    const baseChance = 0.8;
    const currentIndex = RARITIES.indexOf(currentRarity);
    const rarityFactor = 1 - (currentIndex * 0.08);
    return Math.max(0.2, baseChance * rarityFactor * multiplier);
  };

  // Функція для отримання випадкового апгрейду
  const getRandomUpgrade = (item) => {
    const possibleUpgrades = getPossibleUpgrades(item.price);
    if (possibleUpgrades.length > 0) {
      const filteredUpgrades = possibleUpgrades.filter(upgrade => upgrade.id !== item.id);
      
      if (filteredUpgrades.length > 0) {
        const randomUpgrade = filteredUpgrades[Math.floor(Math.random() * filteredUpgrades.length)];
        return {
          ...randomUpgrade,
          chance: Math.round(getUpgradeChance(item.rarity) * 100)
        };
      }
    }
    
    const newRarity = getNextRarity(item.rarity);
    const priceMultiplier = newRarity === 'Covert' || newRarity === 'Rare Special Item' ? 10 : 3;
    const newPrice = Math.round(item.price * priceMultiplier * 100) / 100;
    
    return {
      ...item,
      rarity: newRarity,
      price: newPrice,
      chance: Math.round(getUpgradeChance(item.rarity) * 100)
    };
  };

  // Функція для отримання списку можливих цін для апгрейдів
  const getPossibleUpgrades = (price) => {
    const skins = require('../data/skins.json').skins;
    
    if (price < 5) {
      return skins.filter(skin => skin.price >= 5 && skin.price <= 20);
    } else if (price < 20) {
      return skins.filter(skin => skin.price >= 20 && skin.price <= 50);
    } else if (price < 50) {
      return skins.filter(skin => skin.price >= 50 && skin.price <= 100);
    } else if (price < 100) {
      return skins.filter(skin => skin.price >= 100 && skin.price <= 200);
    } else if (price < 200) {
      return skins.filter(skin => skin.price >= 200 && skin.price <= 500);
    } else {
      return skins.filter(skin => skin.price > 500);
    }
  };

  // Фільтруємо предмети, які можна апгрейдити
  const upgradeableItems = inventory.filter(item => 
    RARITIES.indexOf(item.rarity) < RARITIES.length - 1
  );
  
  const [upgradeInProgress, setUpgradeInProgress] = useState(false);
  const [currentUpgrade, setCurrentUpgrade] = useState(null);
  const [chanceMultiplier, setChanceMultiplier] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [glowColor, setGlowColor] = useState('from-yellow-500 to-amber-500');
  const [rotationSpeed, setRotationSpeed] = useState(1);

  const upgradeChance = selectedItem ? Math.round(getUpgradeChance(selectedItem.rarity, chanceMultiplier) * 100) : 0;

  // Анімація кольорів
  useEffect(() => {
    if (isAnimating) {
      const colors = [
        'from-yellow-500 to-amber-500',
        'from-blue-500 to-purple-500',
        'from-green-500 to-emerald-500',
        'from-pink-500 to-rose-500',
        'from-cyan-500 to-blue-500'
      ];
      
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % colors.length;
        setGlowColor(colors[currentIndex]);
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  const handleChanceChange = (e) => {
    const value = parseFloat(e.target.value);
    setChanceMultiplier(Math.min(Math.max(value, 0.5), 2));
  };

  const handleUpgrade = () => {
    if (!selectedItem || isUpgrading) return;
    
    const upgrade = getRandomUpgrade(selectedItem);
    setCurrentUpgrade(upgrade);
    setUpgradeInProgress(true);
    setIsUpgrading(true);
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);
    
    const baseChance = getUpgradeChance(selectedItem.rarity) / 100 * upgrade.chance;
    const chance = baseChance * chanceMultiplier;
    const isSuccess = Math.random() < chance;
    
    // Анімація зі змінною швидкістю
    const totalDuration = 8000; // 8 секунд загалом
    let startTime = Date.now();
    
    const animate = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / totalDuration);
      
      // Зміна швидкості обертання
      if (progress < 0.3) {
        // Повільний старт (0-30%)
        setRotationSpeed(easeInQuad(progress / 0.3) * 3);
        setPulseIntensity(1 + (progress / 0.3) * 0.5);
      } else if (progress < 0.7) {
        // Максимальна швидкість (30-70%)
        setRotationSpeed(3);
        setPulseIntensity(1.5);
      } else {
        // Сповильнення (70-100%)
        setRotationSpeed(easeOutQuad((progress - 0.7) / 0.3) * 3);
        setPulseIntensity(1.5 - ((progress - 0.7) / 0.3) * 0.5);
      }
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Анімація завершена
        const result = {
          success: isSuccess,
          originalItem: selectedItem,
          newItem: isSuccess ? {
            ...upgrade,
            id: selectedItem.id,
            price: upgrade.price,
            rarity: upgrade.rarity || selectedItem.rarity
          } : null
        };
        
        onUpgrade(selectedItem, isSuccess ? result.newItem : null);
        
        setUpgradeResult(result);
        setIsUpgrading(false);
        setUpgradeInProgress(false);
        setIsAnimating(false);
        
        // Затримка перед показом результату
        setTimeout(() => {
          setShowResult(true);
        }, 500);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Функції для плавного прискорення/уповільнення
  const easeInQuad = (t) => t * t;
  const easeOutQuad = (t) => t * (2 - t);

  const closeResult = () => {
    setShowResult(false);
    setUpgradeResult(null);
    setSelectedItem(null);
    setAnimationProgress(0);
    setRotationSpeed(1);
    setPulseIntensity(1);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Система Апгрейду
        </h2>
        <p className="text-gray-400 mt-1">Підвищуйте рідкість своїх скінів</p>
      </div>
      
      {!selectedItem ? (
        <div>
          <p className="text-gray-300 mb-4 text-center">Виберіть предмет для апгрейду:</p>
          {upgradeableItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upgradeableItems.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-gradient-to-br ${RARITY_COLORS[item.rarity] || 'from-gray-700 to-gray-800'} p-0.5 rounded-lg cursor-pointer`}
                >
                  <div className="bg-gray-900 rounded-lg p-4 h-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img 
                            src={`/items/${item.image}`} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/items/default.png';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400 text-center p-1">{item.name}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        <RarityBadge rarity={item.rarity} />
                        <p className="text-green-400 text-sm mt-1">${item?.price?.toFixed?.(2) || '0.00'}</p>
                      </div>
                      <FaArrowUp className="text-blue-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">У вашому інвентарі немає предметів для апгрейду.</p>
              <p className="text-gray-500 text-sm mt-2">Відкрийте кейси, щоб отримати більше предметів</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <RarityBadge rarity={selectedItem.rarity} />
                  <span className="text-green-400 font-mono">${selectedItem.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-300">Апгрейд:</p>
                <p className="text-blue-400 font-medium">Випадковий скін</p>
                <p className="text-xs text-gray-400">Шанс: {Math.round((getUpgradeChance(selectedItem.rarity) * 100))}%</p>
              </div>
            </div>
            
            <div className="mb-6">
              {/* Слайдер для зміни шансу */}
              <div className="mb-6 px-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-300">Множник шансу: {chanceMultiplier.toFixed(1)}x</span>
                  <span className="text-sm text-yellow-400">
                    Шанс: {Math.round(getUpgradeChance(selectedItem.rarity) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={chanceMultiplier}
                  onChange={handleChanceChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={upgradeInProgress}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5x (дешевше)</span>
                  <span>2.0x (кращі шанси)</span>
                </div>
              </div>

              {/* Анімація апгрейду */}
              <div className="relative">
                {/* Круговий індикатор шансу з орбітою */}
                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Фон кола */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="2"
                    />
                    {/* Заповнення залежно від шансу */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{
                        strokeDashoffset: upgradeInProgress 
                          ? [251.2, 251.2 - (251.2 * (upgradeChance / 100))]
                          : 251.2 - (251.2 * (upgradeChance / 100))
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Плавна анімація зі змінною швидкістю (14с) */}
                    <motion.g
                      initial={{ rotate: 0, scale: 1 }}
                      animate={{
                        rotate: upgradeInProgress 
                          ? 360 * 12 + (360 * (upgradeChance / 100))  // Більше обертів для 14с
                          : 0,
                        scale: upgradeInProgress ? [1, 1.05, 1] : 1
                      }}
                      transition={{
                        duration: 14,  // Збільшено до 14 секунд
                        ease: [0.1, 0.7, 0.3, 0.9],
                        rotate: {
                          type: 'tween',
                          ease: [0.1, 0.3, 0.7, 0.9], // Плавна крива прискорення/уповільнення
                          duration: 14
                        },
                        scale: {
                          duration: 0.8,  // Повільніше пульсація
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }
                      }}
                      style={{
                        transformOrigin: '50px 50px',
                        x: '50px',
                        y: '50px',
                        filter: 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.7))',
                        willChange: 'transform',
                        animation: upgradeInProgress ? 'pulse 0.8s ease-in-out infinite' : 'none'
                      }}
                    >
                      <defs>
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        
                        <style>
                          {`
                            @keyframes pulse {
                              0% { transform: scale(1); }
                              50% { transform: scale(1.05); }
                              100% { transform: scale(1); }
                            }
                          `}
                        </style>
                      </defs>
                      
                      {/* Основа стрілки */}
                      <path 
                        d="M0,0 L0,-35" 
                        stroke="url(#arrowGradient)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Наконечник стрілки */}
                      <polygon 
                        points="0,-35 6,-28 0,-22 -6,-28" 
                        fill="url(#arrowGradient)"
                        stroke="#b45309"
                        strokeWidth="1"
                      />
                      
                      {/* Додатковий ефект сяйва */}
                      <motion.circle
                        cx="0"
                        cy="-17.5"
                        r="3"
                        fill="#fde68a"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: upgradeInProgress ? [0.2, 0.8, 0.2] : 0,
                          scale: [1, 1.3, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: 'loop'
                        }}
                      />
                    </motion.g>
                    
                    {/* Центральна точка з ефектом пульсації */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="5" 
                      fill="#f59e0b"
                      initial={{ scale: 1 }}
                      animate={{
                        scale: upgradeInProgress ? [1, 1.1, 1] : 1,
                        boxShadow: upgradeInProgress ? '0 0 15px rgba(245, 158, 11, 0.7)' : 'none'
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                    />
                    
                    {/* Зовнішнє кільце з анімацією */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="none" 
                      stroke="rgba(245, 158, 11, 0.3)" 
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: upgradeInProgress ? 1 : 0,
                        opacity: upgradeInProgress ? 1 : 0.5
                      }}
                      transition={{
                        duration: 7,
                        ease: 'easeInOut'
                      }}
                      strokeDasharray="1 1"
                    />
                    
                    {/* Відображення відсотків у центрі */}
                    <text 
                      x="50" 
                      y="55" 
                      textAnchor="middle" 
                      fontSize="20" 
                      fill="#e2e8f0"
                      fontWeight="bold"
                    >
                      {upgradeChance}%
                    </text>
                  </svg>
                </div>
                
                <div className="flex items-center justify-center space-x-8">
                  {/* Поточний предмет */}
                  <motion.div 
                    className="text-center z-10"
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: upgradeInProgress ? [1, 1.1, 1] : 1,
                      x: upgradeInProgress ? [-10, 10, -10] : 0
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: upgradeInProgress ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-24 h-24 bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
                      {selectedItem.image ? (
                        <img 
                          src={`/items/${selectedItem.image}`} 
                          alt={selectedItem.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/items/default.png';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 text-center p-1">{selectedItem.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">Поточний</p>
                  </motion.div>
                  
                  {/* Стрілка */}
                  <motion.div 
                    className="text-4xl"
                    animate={{
                      scale: upgradeInProgress ? [1, 1.2, 1] : 1,
                      color: upgradeInProgress ? ["#f59e0b", "#ec4899", "#3b82f6"] : "#f59e0b"
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: upgradeInProgress ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    →
                  </motion.div>
                  
                  {/* Новий предмет */}
                  <motion.div 
                    className="text-center z-10"
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: upgradeInProgress ? [1, 1.1, 1] : 1,
                      x: upgradeInProgress ? [10, -10, 10] : 0,
                      boxShadow: upgradeInProgress ? "0 0 20px rgba(245, 158, 11, 0.5)" : "none"
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: upgradeInProgress ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-24 h-24 bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
                      {upgradeInProgress && currentUpgrade ? (
                        <motion.img 
                          src={`/items/${currentUpgrade.image}`} 
                          alt={currentUpgrade.name}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 0.5 }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/items/default.png';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 text-center p-1">???</span>
                      )}
                    </div>
                    <motion.p 
                      className="text-sm font-medium mb-1"
                      initial={{ color: "#9ca3af" }}
                      animate={{ 
                        color: upgradeInProgress ? ["#9ca3af", "#f59e0b"] : "#9ca3af"
                      }}
                      transition={{ duration: 1, repeat: upgradeInProgress ? Infinity : 0 }}
                    >
                      {upgradeInProgress && currentUpgrade ? currentUpgrade.name : 'Випадковий скін'}
                    </motion.p>
                    <motion.p 
                      className="text-sm font-medium"
                      initial={{ color: "#34d399" }}
                      animate={{ 
                        color: ["#34d399", "#f59e0b", "#3b82f6"],
                        scale: upgradeInProgress ? [1, 1.1, 1] : 1
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: upgradeInProgress ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      {upgradeInProgress && currentUpgrade 
                        ? `+${(currentUpgrade.price - selectedItem.price).toFixed(2)}$` 
                        : `${Math.round((getUpgradeChance(selectedItem.rarity) * 100))}% шанс`
                      }
                    </motion.p>
                  </motion.div>
                </div>
                
                {/* Ефект світіння */}
                {upgradeInProgress && (
                  <motion.div 
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${glowColor} opacity-30 blur-2xl -z-10`}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Шанс успіху</span>
                <span>{upgradeChance}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${upgradeChance}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <motion.button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 ${
                  isUpgrading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : `bg-gradient-to-r ${glowColor} hover:opacity-90`
                }`}
                whileHover={!isUpgrading ? { scale: 1.03 } : {}}
                whileTap={!isUpgrading ? { scale: 0.98 } : {}}
                animate={{
                  background: upgradeInProgress 
                    ? [
                        'linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6)',
                        'linear-gradient(90deg, #3b82f6, #f59e0b, #ec4899)',
                        'linear-gradient(90deg, #ec4899, #3b82f6, #f59e0b)'
                      ]
                    : `linear-gradient(90deg, ${glowColor.replace('to-', '')})`,
                  backgroundSize: upgradeInProgress ? '200% 200%' : '100% 100%',
                  transition: {
                    duration: 2,
                    repeat: upgradeInProgress ? Infinity : 0,
                    ease: 'linear'
                  }
                }}
              >
                {isUpgrading ? (
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center justify-center"
                  >
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Апгрейд...
                  </motion.span>
                ) : (
                  'Апгрейднути'
                )}
              </motion.button>
              
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                disabled={isUpgrading}
              >
                <FaTimes className="mr-1" /> Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {showResult && upgradeResult && (
          <motion.div 
            key="upgrade-result-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <div className={`bg-gradient-to-br ${upgradeResult.success ? 'from-green-900/30 to-green-800/30' : 'from-red-900/30 to-red-800/30'} border ${upgradeResult.success ? 'border-green-500/30' : 'border-red-500/30'} rounded-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-10"></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${upgradeResult.success ? 'bg-green-500/20' : 'bg-red-500/20'} mb-4`}
                  >
                    {upgradeResult.success ? (
                      <FaCheck className="text-green-400 text-3xl" />
                    ) : (
                      <FaTimes className="text-red-400 text-3xl" />
                    )}
                  </motion.div>
                  <h3 className={`text-2xl font-bold ${upgradeResult.success ? 'text-green-400' : 'text-red-400'} mb-2`}>
                    {upgradeResult.success ? 'Успішний апгрейд!' : 'Не вдалося покращити'}
                  </h3>
                  <p className="text-gray-300">
                    {upgradeResult.success 
                      ? `Ваш предмет тепер ${upgradeResult.newItem.rarity}!` 
                      : 'Спробуйте ще раз, коли будете готові'}
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
                        {upgradeResult.originalItem.image ? (
                          <img 
                            src={`/items/${upgradeResult.originalItem.image}`} 
                            alt={upgradeResult.originalItem.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/items/default.png';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400 text-center p-1">
                            {upgradeResult.originalItem.name}
                          </span>
                        )}
                      </div>
                      <RarityBadge rarity={upgradeResult.originalItem.rarity} size="sm" />
                      <p className="text-gray-300 text-sm mt-1">
                        ${upgradeResult.originalItem.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="text-2xl text-yellow-400 mx-2">→</div>
                    
                    <div className="text-center">
                      {upgradeResult.success ? (
                        <>
                          <div className="w-16 h-16 bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden relative">
                            {upgradeResult.newItem.image ? (
                              <img 
                                src={`/items/${upgradeResult.newItem.image}`} 
                                alt={upgradeResult.newItem.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/items/default.png';
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-400 text-center p-1">
                                {upgradeResult.newItem.name}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          </div>
                          <RarityBadge rarity={upgradeResult.newItem.rarity} size="sm" />
                          <p className="text-green-400 font-medium text-sm">
                            ${upgradeResult.newItem.price?.toFixed(2) || '0.00'}
                          </p>
                        </>
                      ) : (
                        <div className="w-16 h-16 bg-red-900/30 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <FaTimes className="text-red-500 text-3xl" />
                        </div>
                      )}
                      {!upgradeResult.success && (
                        <p className="text-red-400 text-sm">Втрачено</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={closeResult}
                  className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                    upgradeResult.success
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500'
                  }`}
                >
                  {upgradeResult.success ? 'Чудово!' : 'Спробувати ще раз'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
