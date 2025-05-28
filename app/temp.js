import Image from "next/image";

export default function Home() {
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
          
          <div className="flex items-center space-x-6">
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md font-medium transition-colors">
              Deposit
            </button>
            <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-md">
              <span className="text-yellow-400">$0.00</span>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Inventory Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Inventory</h2>
            <button className="text-yellow-400 hover:text-yellow-300 text-sm">View All</button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-yellow-500 transition-colors cursor-pointer">
                <div className="aspect-square bg-gray-700/50 rounded mb-2 flex items-center justify-center">
                  <span className="text-3xl">🔫</span>
                </div>
                <p className="text-sm text-center truncate">AWP | Dragon Lore</p>
                <p className="text-xs text-yellow-400 text-center">$2,500.00</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cases Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Available Cases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-yellow-500 transition-colors cursor-pointer group">
                <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded mb-3 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/next.svg')] bg-contain bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <span className="text-5xl z-10">📦</span>
                </div>
                <h3 className="font-medium text-center">Danger Zone Case</h3>
                <p className="text-yellow-400 text-center">$2.49</p>
              </div>
            ))}
          </div>
        </section>
      </main>

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
