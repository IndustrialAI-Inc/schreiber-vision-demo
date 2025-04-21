import React from 'react';

interface MessageSourcesProps {
  isVisible: boolean;
  query?: string;
}

const sourceImages = {
  productInfo: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/spec_square-wvjSNvsEUpnM7uOqiqIECvtrs6PbYY.png',
  californiaFruit: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/california_square-TP8UFIpE1MYC69DXxWVlY0br0rYYAs.png',
  specDocument: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/sds_square-xA0jUhlcsa60UdiIrW50vuU4lwIHxT.png',
  sharepoint: 'https://7j9bzsb3hggfrl5a.public.blob.vercel-storage.com/sharepoint_square-ZR8hAfOemBMXAqXS6wQu5SaXplDjbR.png'
};

const MessageSources: React.FC<MessageSourcesProps> = ({ isVisible, query = '' }) => {
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
      <h2 className="text-xl font-semibold text-white pb-2">
        Sources
      </h2>
      <p className="text-muted-foreground text-xs mb-2">Reference materials:</p>
      
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
    </div>
  );
};

export default MessageSources;