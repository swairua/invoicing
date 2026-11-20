import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTab } from '@/components/web-manager/CategoriesTab';
import { VariantsTab } from '@/components/web-manager/VariantsTab';
import { HeroSlidesTab } from '@/components/web-manager/HeroSlidesTab';

const WebManager = () => {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Web Manager</h1>
          <p className="text-muted-foreground">
            Manage product categories, variants, and the rotating homepage hero slider
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">
            Categories
          </TabsTrigger>
          <TabsTrigger value="variants">
            Variants
          </TabsTrigger>
          <TabsTrigger value="hero-slides">
            Hero Slides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="variants" className="mt-6">
          <VariantsTab />
        </TabsContent>

        <TabsContent value="hero-slides" className="mt-6">
          <HeroSlidesTab />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-orange-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Categories are displayed on the public website's product menu</li>
          <li>• Variants represent individual products within each category</li>
          <li>• Use display order to arrange categories and variants</li>
          <li>• Toggle active/inactive status to control visibility on the website</li>
          <li>• Images are stored in /public/products/ directory</li>
        </ul>
      </div>
    </div>
  );
};

export default WebManager;
