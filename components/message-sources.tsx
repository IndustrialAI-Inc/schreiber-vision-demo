import React, { useState } from 'react';

interface MessageSourcesProps {
  isVisible: boolean;
  query?: string;
  isLoading?: boolean;
}

const sourceImages = {
  productInfo: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/spec_square-wvjSNvsEUpnM7uOqiqIECvtrs6PbYY.png',
  californiaFruit: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/california_square-TP8UFIpE1MYC69DXxWVlY0br0rYYAs.png',
  specDocument: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/sds_square-xA0jUhlcsa60UdiIrW50vuU4lwIHxT.png',
  sharepoint: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/sharepoint_square-ZR8hAfOemBMXAqXS6wQu5SaXplDjbR.png'
};

const MessageSources: React.FC<MessageSourcesProps> = ({ isVisible, query = '', isLoading = false }) => {
  // Default to not expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show if explicitly visible and we're searching for Strawberry NF Light YFB cost-related info
  const showStrawberryCostSources = 
    isVisible && 
    query.toLowerCase().includes('strawberry nf light') &&
    (query.toLowerCase().includes('cost') || 
     query.toLowerCase().includes('price') || 
     query.toLowerCase().includes('production volume'));

  if (!showStrawberryCostSources) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-amber-200/30 dark:border-amber-800/30">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-xl font-semibold text-white">
          Sources
        </h2>
        {isLoading && (
          <div className="flex items-center text-zinc-400 text-sm">
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"></div>
            Analyzing documents...
          </div>
        )}
      </div>
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full text-muted-foreground text-xs mb-2 cursor-pointer hover:text-white transition-colors"
      >
        <span>Reference materials</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      
      {isExpanded && (
        <>
          <div className="flex mb-4 space-x-3">
            <img src={sourceImages.productInfo} alt="Product Info" className="w-6 h-6" />
            <img src={sourceImages.californiaFruit} alt="California Fruit" className="w-6 h-6" />
            <img src={sourceImages.specDocument} alt="Specification Document" className="w-6 h-6" />
            <img src={sourceImages.sharepoint} alt="SharePoint" className="w-6 h-6" />
          </div>
          
          <div className="text-sm space-y-2">
            <p className=""><strong>Product Information Sheet</strong>: Contains detailed product cost data and pricing structures across different volumes.</p>
            <p className=""><strong>California Custom Fruit Flavors</strong>: Supplier information with ingredient cost breakdowns and volume pricing options.</p>
            <p className=""><strong>Specification Document</strong>: Technical requirements document with production cost implications.</p>
            <p className=""><strong>SharePoint Documentation</strong>: Internal reference data on cost sensitivity thresholds and production volume analysis.</p>
          </div>
        </>
      )}
      
      {!isExpanded && isLoading && (
        <div className="py-2">
          <div className="flex mb-3 space-x-3">
            {/* Skeleton images */}
            <div className="w-6 h-6 bg-zinc-700/60 rounded animate-pulse"></div>
            <div className="w-6 h-6 bg-zinc-700/60 rounded animate-pulse"></div>
            <div className="w-6 h-6 bg-zinc-700/60 rounded animate-pulse"></div>
            <div className="w-6 h-6 bg-zinc-700/60 rounded animate-pulse"></div>
          </div>
          <div className="h-3 bg-zinc-700/40 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-3 bg-zinc-700/40 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-3 bg-zinc-700/40 rounded w-2/3 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default MessageSources;