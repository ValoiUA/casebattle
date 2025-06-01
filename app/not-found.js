'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className={`transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 mx-auto">
            <Image
              src="/o-kak-cat.png"
              alt="О как кіт"
              fill
              className="object-contain animate-float"
              priority
              style={{
                filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))',
              }}
            />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            404
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-6">
            О как! Сторінку знайти не вдалось
          </h2>
          
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Схоже, що ця сторінка пішла на каву або просто вирішила зникнути. Спробуйте повернутися на головну.
          </p>
          
          <Link 
            href="/" 
            className="relative inline-flex items-center px-8 py-4 overflow-hidden text-lg font-medium text-white border-2 border-purple-500 rounded-full group hover:bg-purple-600/20 transition-all duration-300"
          >
            <span className="absolute left-0 block w-full h-0 transition-all bg-purple-600 opacity-100 group-hover:h-full top-1/2 group-hover:top-0 duration-400 ease"></span>
            <span className="absolute left-0 flex items-center justify-center w-10 h-10 duration-300 transform -translate-x-12 bg-white rounded-full group-hover:translate-x-0 ease">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l7-7 7 7m-7-7v18"></path>
              </svg>
            </span>
            <span className="relative flex items-center">
              Повернутись на головну
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </Link>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-40px) rotate(0deg); }
          75% { transform: translateY(-20px) rotate(-5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
