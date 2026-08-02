import ProductForm from '@/components/ProductForm';
import { saveProduct } from '../actions';
import { getCategories, getStore } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

export default async function NewProductPage() {
  const storeId = await currentStoreId();
  const [categories, store] = await Promise.all([
    getCategories().catch(() => []),
    getStore(storeId).catch(() => null),
  ]);
  const canSetPrice = can((await getAdmin())?.role, 'setPrice');

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <ProductForm
        action={saveProduct}
        categories={categories.length > 0 ? categories : undefined}
        canSetPrice={canSetPrice}
        templateId={store?.templateId}
      />
    </main>
  );
}
