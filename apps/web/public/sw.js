if (!self.define) {
  let a,
    s = {};
  const e = (e, t) => (
    (e = new URL(e + ".js", t).href),
    s[e] ||
      new Promise((s) => {
        if ("document" in self) {
          const a = document.createElement("script");
          ((a.src = e), (a.onload = s), document.head.appendChild(a));
        } else ((a = e), importScripts(e), s());
      }).then(() => {
        let a = s[e];
        if (!a) throw new Error(`Module ${e} didn’t register its module`);
        return a;
      })
  );
  self.define = (t, i) => {
    const n =
      a ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[n]) return;
    let r = {};
    const c = (a) => e(a, n),
      d = { module: { uri: n }, exports: r, require: c };
    s[n] = Promise.all(t.map((a) => d[a] || c(a))).then((a) => (i(...a), r));
  };
}
define(["./workbox-495fd258"], function (a) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "2e01c9c39b74716831838098d28625bf",
        },
        {
          url: "/_next/static/chunks/1250-868ad3b738d60d0e.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/1528-f7252284a4bbc2f4.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/1799-d9d08a5df0e2dad1.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/1988-8a3b93fd17799383.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/1dd3208c-08727f7dd9a18211.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/2146.0476b6db62881b65.js",
          revision: "0476b6db62881b65",
        },
        {
          url: "/_next/static/chunks/2359-ab7523244a098630.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/243-1688c68d23198893.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/2676-436be652466aef57.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/3543-45fd5c9a58d01fd3.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/4114-7d1d34ba7f2792d4.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/425a1fef.3f713acac9e4bd1b.js",
          revision: "3f713acac9e4bd1b",
        },
        {
          url: "/_next/static/chunks/4387-60b8a6acb13a6084.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/4546-188a4336984abe0d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5063-7e8ac3564b1899dc.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5067-2485aa1214ee4ec5.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5182-62befbeb53fd7593.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/570-39223f6f2397c781.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5711-ebfb266fd49749b5.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5947-d48c548cce402e5f.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/5980-05cd7e42e3c4b781.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/6177-0126a8a25b8c10ad.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/6212-d529948e78c5f2a5.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/6302-00842c4eeae865b9.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/6340-b590486bd35cf6b8.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/6606.88d44497b443c398.js",
          revision: "88d44497b443c398",
        },
        {
          url: "/_next/static/chunks/6609-58a1df2957d99d28.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7260-1ed03bc379e312b4.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7761-6460b9686c1fc8a1.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7787-5d3185139ddadde6.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7843-8bc8c345a683b37d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7905-8fa34d1d8828b4e1.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/7c09d4dc-55f9571466608307.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/819-afe25a70ef22bff1.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/8430-2feb0d83cf594e6d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/8693-1603cd693b0d1eb8.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/89ddd23d-4f74674f5c0ea5cb.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/9137-18dd08de08df22af.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/9658-fbd2054accd35723.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/98f82933-9f146ab3cf81edbf.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/9964-d2bba95d1ea793db.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/9976-4027b134bb2d6dc7.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(auth)/sign-in/page-3077f8235081a1db.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(auth)/sign-up/page-0686d44e07e2dd2f.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/activity/page-82e007893cbf7fd4.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/alerts/page-904b011203e83174.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/analytics/page-cfad357e522d4e2d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/api-docs/page-0f56277e7c3e0917.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/api-keys/page-fe63404d88382d4d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/bookings/%5Bid%5D/page-8702787c03857685.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/bookings/new/page-55d01afb7e2af494.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/bookings/page-cfe99b0609448e58.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/categories/page-6c9076587eb4a848.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/customers/page-d24f6a0e1f66664c.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/inventory/%5Bid%5D/edit/page-c322296a99d75ec5.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/inventory/%5Bid%5D/page-022dbb7eea3d4515.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/inventory/new/page-58a4f105ae110b78.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/inventory/page-885101bd47dcfb91.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/page-e2a65b395809da26.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/pwa-settings/page-d1a74bfd6fa54aeb.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/reports/page-9acd698ccb9ce57a.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/settings/page-ddd794f9970f58f9.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/warehouses/page-2baea58a05d67016.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/webhooks/page-ccdbfc656e8e6511.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/layout-2a5a60c4877692db.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/shipments/%5Bid%5D/page-a27231a4c5595bf0.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/shipments/create/page-7ee15c2e3a0c327d.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/shipments/page-a3073d6cf515b369.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/warehouse/adjustments/page-c1af846677054544.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/warehouse/cycle-counts/page-6c333bae693a3d44.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/warehouse/locations/page-f92d6236fed0db74.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/warehouse/transfers/page-7bf9f1a342c36ad0.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/about/page-74ff8ce16646b81a.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/accessibility/page-b7525ccb36711017.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/blog/page-48141996bedc8edd.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/contact/page-3ad6fbc8cb1eeb4c.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/docs/page-affef5d49581bad1.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/platform/integrations/page-696c00d696d48a33.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/platform/multi-tenant/page-0d331f82f9c2b038.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/platform/security/page-361422a712b4a9cd.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/pricing/page-88b38e368ce812bf.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/privacy/page-0d0f0e878c9baea2.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/solutions/analytics/page-a8355bb68bba6a29.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/solutions/erp-integration/page-7256d40003d9f2eb.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/solutions/stock-booking/page-681216e501f4bb72.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/terms/page-6f4bee984b7c5c56.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-744ea0c1646c5875.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/analytics/page-2d455ee79d2b86d2.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/customer-analytics/page-4f1b869a3f9af819.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/forecasting/page-5ce5871fa606561a.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/grn/%5Bid%5D/page-973b8adea295fb1e.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/grn/page-ba31dde23e5e6467.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/grn/receive/page-7a44bbb83b1c89e2.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/packs/%5Bid%5D/page-6e0c12fbc35455fe.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/pick-lists/%5Bid%5D/page-ab049e4ae30ee637.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/purchase-orders/%5Bid%5D/page-08d6f316fa350cea.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/purchase-orders/new/page-1f35748be5332f58.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/purchase-orders/page-a8cbee24a28ae970.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/reports/builder/page-ec2065d7776d3a0b.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/reports/view/page-6203b2918a36d65a.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/rmas/%5Bid%5D/page-f4569a6e69e00880.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/rmas/page-1f4d4783dc37f852.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sales-orders/%5Bid%5D/page-70ad244293d104ba.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sales-orders/new/page-dcfad44db96ba5b9.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sales-orders/page-efbfc5582f6c8ba2.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/dashboard/settings/accessibility/page-e1a391243891ce08.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/integrations/%5Bid%5D/page-ef4955f88183bc2e.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/integrations/page-46d934e1f4cb5a00.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/invite/%5Btoken%5D/page-cdaeac57d7fbe24e.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/layout-e9cca9ebb1610388.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/notifications/page-deb4a7109e857a8a.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/app/page-5f000247f1df945e.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/da458701.ddd0211025cc36c5.js",
          revision: "ddd0211025cc36c5",
        },
        {
          url: "/_next/static/chunks/framework-f67b0c50d92b2b9f.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/main-app-5bf5e4e7e17b3023.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/main-ba9c6358c8561e1c.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/pages/_app-475e7e1ea3b2c234.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/pages/_error-5558af2983b90ceb.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-205d0efff6cd6518.js",
          revision: "p6ra9Ej78q-ylUkORT-Kq",
        },
        {
          url: "/_next/static/css/214284378bc9b18f.css",
          revision: "214284378bc9b18f",
        },
        {
          url: "/_next/static/css/3add334ee59f67ac.css",
          revision: "3add334ee59f67ac",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/_next/static/p6ra9Ej78q-ylUkORT-Kq/_buildManifest.js",
          revision: "2d4e7ac5aaf29353e7fafcfff0ea4d04",
        },
        {
          url: "/_next/static/p6ra9Ej78q-ylUkORT-Kq/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/icons/README.md",
          revision: "a777547b0ba02fd68dd8eb71fe27508d",
        },
        { url: "/manifest.json", revision: "8ff5d4d01a0832655e65dc0151bea4a9" },
        { url: "/robots.txt", revision: "9ebab3eea4c37b70e6ee2fcb78559f36" },
        {
          url: "/screenshots/README.md",
          revision: "59ab6e7229aebd83d019bc999aa63397",
        },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      "/",
      new a.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: a,
              response: s,
              event: e,
              state: t,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new a.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new a.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new a.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:mp4)$/i,
      new a.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:js)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:css|less)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new a.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ url: a }) => {
        if (!(self.origin === a.origin)) return !1;
        const s = a.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new a.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ url: a }) => {
        if (!(self.origin === a.origin)) return !1;
        return !a.pathname.startsWith("/api/");
      },
      new a.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ url: a }) => !(self.origin === a.origin),
      new a.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});
