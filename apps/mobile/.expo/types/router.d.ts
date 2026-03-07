/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(tabs)` | `/(tabs)/` | `/(tabs)/analytics` | `/(tabs)/assembly` | `/(tabs)/capa` | `/(tabs)/cognitive` | `/(tabs)/compliance` | `/(tabs)/cyclecount` | `/(tabs)/delivery` | `/(tabs)/dock` | `/(tabs)/inventory` | `/(tabs)/invoices` | `/(tabs)/labor` | `/(tabs)/marshalling` | `/(tabs)/more` | `/(tabs)/orders` | `/(tabs)/picking` | `/(tabs)/profile` | `/(tabs)/quality` | `/(tabs)/receiving` | `/(tabs)/returns` | `/(tabs)/shipping` | `/(tabs)/slotting` | `/(tabs)/suppliers` | `/(tabs)/transfers` | `/(tabs)/waves` | `/(tabs)/yard` | `/_sitemap` | `/analytics` | `/assembly` | `/capa` | `/cognitive` | `/compliance` | `/cyclecount` | `/delivery` | `/dock` | `/inventory` | `/invoices` | `/labor` | `/login` | `/marshalling` | `/more` | `/orders` | `/picking` | `/profile` | `/quality` | `/receiving` | `/returns` | `/shipping` | `/slotting` | `/suppliers` | `/transfers` | `/waves` | `/yard`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
