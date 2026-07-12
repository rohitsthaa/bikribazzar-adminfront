import ProductForm from '@/components/ProductForm';
import { saveProduct } from '../actions';
import { getCategories } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';

export default async function NewProductPage() {
  const categories = await getCategories().catch(() => []);
  const canSetPrice = can((await getAdmin())?.role, 'setPrice');

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <ProductForm action={saveProduct} categories={categories.length > 0 ? categories : undefined} canSetPrice={canSetPrice} />
    </main>
  );
}
