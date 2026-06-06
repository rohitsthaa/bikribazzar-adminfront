import { getTestimonials } from '@/lib/api';
import { addTestimonial, editTestimonial, removeTestimonial } from './actions';
import TestimonialsClient from './TestimonialsClient';

export const metadata = { title: 'Testimonials — Soul Thread Admin' };

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Testimonials</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {testimonials.length} {testimonials.length === 1 ? 'testimonial' : 'testimonials'} — shown on the homepage
        </p>
      </div>

      <TestimonialsClient
        testimonials={testimonials}
        addAction={addTestimonial}
        editAction={editTestimonial}
        removeAction={removeTestimonial}
      />
    </main>
  );
}
