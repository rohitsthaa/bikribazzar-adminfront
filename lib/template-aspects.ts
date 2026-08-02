// Where a product image actually shows on the storefront, and at what aspect
// ratio — used to give the image-crop tool an accurate "here's exactly what
// customers will see" preview instead of guessing.
//
// The product-detail page's main photo is 4:5 + object-cover on every one of
// the 10 templates (9 share components/ProductGallery.tsx in the storefront
// repo; folio inlines its own gallery but matches the same ratio). The shop
// grid *card* thumbnail varies per template — most also use 4:5, a few use a
// square or landscape crop instead. Keep this in sync with the storefront's
// actual Card.tsx files if a template's card ratio ever changes.
export const DETAIL_ASPECT = '4/5';

export const CARD_ASPECT_BY_TEMPLATE: Record<string, string> = {
  aurora: '4/5',
  bloom: '4/5',
  coastal: '4/5',
  neon: '4/5',
  folio: '4/5',
  soulthread: '4/5',
  artisan: '3/4',
  capsule: '3/4',
  bubbly: '1/1',
  profile: '4/3',
};

export function cardAspectFor(templateId: string | undefined): string {
  return (templateId && CARD_ASPECT_BY_TEMPLATE[templateId]) || DETAIL_ASPECT;
}
