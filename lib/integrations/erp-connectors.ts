import axios from "axios";
import * as crypto from "crypto";
import * as qs from "querystring";

/**
 * NetSuite REST API Connector
 * Supports: SuiteTalk REST Web Services
 */

export interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
  realm: string; // Account ID
  baseUrl?: string;
}

export interface NetSuiteCustomer {
  id?: string;
  companyName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface NetSuiteProduct {
  id?: string;
  itemId: string;
  displayName: string;
  description?: string;
  basePrice: number;
  cost?: number;
  quantityOnHand?: number;
}

export interface NetSuiteSalesOrder {
  id?: string;
  customer: string; // Internal ID
  tranDate: string;
  items: Array<{
    item: string; // Internal ID
    quantity: number;
    rate: number;
    amount: number;
  }>;
  memo?: string;
  shipAddress?: {
    addressee: string;
    addr1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface NetSuiteInventoryAdjustment {
  account: string; // Internal ID
  location: string; // Internal ID
  adjustments: Array<{
    item: string; // Internal ID
    quantityOnHand: number;
    adjustQtyBy: number;
    memo?: string;
  }>;
}

export class NetSuiteConnector {
  private config: NetSuiteConfig;
  private baseUrl: string;

  constructor(config: NetSuiteConfig) {
    this.config = config;
    this.baseUrl =
      config.baseUrl ||
      `https://${config.accountId}.suitetalk.api.netsuite.com`;
  }

  /**
   * Generate OAuth 1.0a signature
   */
  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>,
  ): string {
    // Sort parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams),
    ].join("&");

    // Create signing key
    const signingKey = [
      encodeURIComponent(this.config.consumerSecret),
      encodeURIComponent(this.config.tokenSecret),
    ].join("&");

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", signingKey)
      .update(signatureBase)
      .digest("base64");

    return signature;
  }

  /**
   * Get OAuth authorization header
   */
  private getAuthHeader(method: string, url: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_token: this.config.tokenId,
      oauth_signature_method: "HMAC-SHA256",
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: "1.0",
      realm: this.config.realm,
    };

    const signature = this.generateOAuthSignature(method, url, oauthParams);
    oauthParams.oauth_signature = signature;

    const authHeader =
      "OAuth " +
      Object.keys(oauthParams)
        .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
        .join(", ");

    return authHeader;
  }

  /**
   * Make authenticated request
   */
  private async request(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<any> {
    const url = `${this.baseUrl}/services/rest${endpoint}`;

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          Authorization: this.getAuthHeader(method, url),
          "Content-Type": "application/json",
          prefer: "transient",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "NetSuite API error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  /**
   * CUSTOMERS
   */

  async getCustomers(limit: number = 100): Promise<NetSuiteCustomer[]> {
    const response = await this.request(
      "GET",
      `/record/v1/customer?limit=${limit}`,
    );
    return response.items || [];
  }

  async getCustomer(id: string): Promise<NetSuiteCustomer | null> {
    try {
      const response = await this.request("GET", `/record/v1/customer/${id}`);
      return response;
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customer: NetSuiteCustomer): Promise<string | null> {
    try {
      const response = await this.request(
        "POST",
        "/record/v1/customer",
        customer,
      );
      return response.id;
    } catch (error) {
      return null;
    }
  }

  async updateCustomer(
    id: string,
    customer: Partial<NetSuiteCustomer>,
  ): Promise<boolean> {
    try {
      await this.request("PATCH", `/record/v1/customer/${id}`, customer);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * PRODUCTS (Inventory Items)
   */

  async getProducts(limit: number = 100): Promise<NetSuiteProduct[]> {
    const response = await this.request(
      "GET",
      `/record/v1/inventoryItem?limit=${limit}`,
    );
    return response.items || [];
  }

  async getProduct(id: string): Promise<NetSuiteProduct | null> {
    try {
      const response = await this.request(
        "GET",
        `/record/v1/inventoryItem/${id}`,
      );
      return response;
    } catch (error) {
      return null;
    }
  }

  async createProduct(product: NetSuiteProduct): Promise<string | null> {
    try {
      const response = await this.request(
        "POST",
        "/record/v1/inventoryItem",
        product,
      );
      return response.id;
    } catch (error) {
      return null;
    }
  }

  async updateProduct(
    id: string,
    product: Partial<NetSuiteProduct>,
  ): Promise<boolean> {
    try {
      await this.request("PATCH", `/record/v1/inventoryItem/${id}`, product);
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateInventory(id: string, quantityOnHand: number): Promise<boolean> {
    return this.updateProduct(id, { quantityOnHand });
  }

  /**
   * SALES ORDERS
   */

  async getSalesOrders(limit: number = 100): Promise<NetSuiteSalesOrder[]> {
    const response = await this.request(
      "GET",
      `/record/v1/salesOrder?limit=${limit}`,
    );
    return response.items || [];
  }

  async getSalesOrder(id: string): Promise<NetSuiteSalesOrder | null> {
    try {
      const response = await this.request("GET", `/record/v1/salesOrder/${id}`);
      return response;
    } catch (error) {
      return null;
    }
  }

  async createSalesOrder(order: NetSuiteSalesOrder): Promise<string | null> {
    try {
      const response = await this.request(
        "POST",
        "/record/v1/salesOrder",
        order,
      );
      return response.id;
    } catch (error) {
      return null;
    }
  }

  async updateSalesOrder(
    id: string,
    order: Partial<NetSuiteSalesOrder>,
  ): Promise<boolean> {
    try {
      await this.request("PATCH", `/record/v1/salesOrder/${id}`, order);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * INVENTORY ADJUSTMENTS
   */

  async createInventoryAdjustment(
    adjustment: NetSuiteInventoryAdjustment,
  ): Promise<string | null> {
    try {
      const response = await this.request(
        "POST",
        "/record/v1/inventoryAdjustment",
        adjustment,
      );
      return response.id;
    } catch (error) {
      return null;
    }
  }

  /**
   * SEARCH (SuiteQL)
   */

  async search(query: string): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/services/rest/query/v1/suiteql`,
        { q: query },
        {
          headers: {
            Authorization: this.getAuthHeader(
              "POST",
              `${this.baseUrl}/services/rest/query/v1/suiteql`,
            ),
            "Content-Type": "application/json",
            prefer: "transient",
          },
        },
      );

      return response.data.items || [];
    } catch (error: any) {
      console.error(
        "NetSuite search error:",
        error.response?.data || error.message,
      );
      return [];
    }
  }

  /**
   * TEST CONNECTION
   */

  async testConnection(): Promise<boolean> {
    try {
      await this.request("GET", "/record/v1/customer?limit=1");
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * SAP Business One Integration
 */

export interface SAPConfig {
  serviceLayerUrl: string;
  companyDB: string;
  username: string;
  password: string;
}

export interface SAPBusinessPartner {
  CardCode?: string;
  CardName: string;
  CardType: "cCustomer" | "cSupplier";
  Phone1?: string;
  EmailAddress?: string;
  Address?: string;
  City?: string;
  Country?: string;
  ZipCode?: string;
}

export interface SAPItem {
  ItemCode?: string;
  ItemName: string;
  QuantityOnStock?: number;
  Price?: number;
  PurchaseUnit?: string;
}

export interface SAPOrder {
  DocEntry?: number;
  CardCode: string;
  DocDate: string;
  DocumentLines: Array<{
    ItemCode: string;
    Quantity: number;
    UnitPrice: number;
  }>;
}

export class SAPConnector {
  private config: SAPConfig;
  private sessionId?: string;
  private sessionTimeout?: NodeJS.Timeout;

  constructor(config: SAPConfig) {
    this.config = config;
  }

  /**
   * Login to SAP Service Layer
   */
  async login(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.config.serviceLayerUrl}/Login`,
        {
          CompanyDB: this.config.companyDB,
          UserName: this.config.username,
          Password: this.config.password,
        },
      );

      this.sessionId = response.data.SessionId;

      // Auto-refresh session every 25 minutes (session timeout is 30 min)
      this.sessionTimeout = setInterval(
        () => {
          this.login();
        },
        25 * 60 * 1000,
      );

      return true;
    } catch (error: any) {
      console.error("SAP login error:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (this.sessionTimeout) {
      clearInterval(this.sessionTimeout);
    }

    if (this.sessionId) {
      try {
        await axios.post(
          `${this.config.serviceLayerUrl}/Logout`,
          {},
          {
            headers: {
              Cookie: `B1SESSION=${this.sessionId}`,
            },
          },
        );
      } catch (error) {
        // Ignore logout errors
      }
    }
  }

  /**
   * Make authenticated request
   */
  private async request(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<any> {
    if (!this.sessionId) {
      await this.login();
    }

    try {
      const response = await axios({
        method,
        url: `${this.config.serviceLayerUrl}/${endpoint}`,
        data,
        headers: {
          Cookie: `B1SESSION=${this.sessionId}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("SAP API error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * BUSINESS PARTNERS (Customers/Suppliers)
   */

  async getBusinessPartners(
    type?: "cCustomer" | "cSupplier",
  ): Promise<SAPBusinessPartner[]> {
    const filter = type ? `?$filter=CardType eq '${type}'` : "";
    const response = await this.request("GET", `BusinessPartners${filter}`);
    return response.value || [];
  }

  async getBusinessPartner(
    cardCode: string,
  ): Promise<SAPBusinessPartner | null> {
    try {
      const response = await this.request(
        "GET",
        `BusinessPartners('${cardCode}')`,
      );
      return response;
    } catch (error) {
      return null;
    }
  }

  async createBusinessPartner(
    partner: SAPBusinessPartner,
  ): Promise<string | null> {
    try {
      const response = await this.request("POST", "BusinessPartners", partner);
      return response.CardCode;
    } catch (error) {
      return null;
    }
  }

  async updateBusinessPartner(
    cardCode: string,
    partner: Partial<SAPBusinessPartner>,
  ): Promise<boolean> {
    try {
      await this.request("PATCH", `BusinessPartners('${cardCode}')`, partner);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ITEMS
   */

  async getItems(): Promise<SAPItem[]> {
    const response = await this.request("GET", "Items");
    return response.value || [];
  }

  async getItem(itemCode: string): Promise<SAPItem | null> {
    try {
      const response = await this.request("GET", `Items('${itemCode}')`);
      return response;
    } catch (error) {
      return null;
    }
  }

  async createItem(item: SAPItem): Promise<string | null> {
    try {
      const response = await this.request("POST", "Items", item);
      return response.ItemCode;
    } catch (error) {
      return null;
    }
  }

  async updateItem(itemCode: string, item: Partial<SAPItem>): Promise<boolean> {
    try {
      await this.request("PATCH", `Items('${itemCode}')`, item);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * SALES ORDERS
   */

  async getOrders(): Promise<SAPOrder[]> {
    const response = await this.request("GET", "Orders");
    return response.value || [];
  }

  async getOrder(docEntry: number): Promise<SAPOrder | null> {
    try {
      const response = await this.request("GET", `Orders(${docEntry})`);
      return response;
    } catch (error) {
      return null;
    }
  }

  async createOrder(order: SAPOrder): Promise<number | null> {
    try {
      const response = await this.request("POST", "Orders", order);
      return response.DocEntry;
    } catch (error) {
      return null;
    }
  }

  async updateOrder(
    docEntry: number,
    order: Partial<SAPOrder>,
  ): Promise<boolean> {
    try {
      await this.request("PATCH", `Orders(${docEntry})`, order);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * INVENTORY
   */

  async getInventory(itemCode?: string): Promise<any[]> {
    const filter = itemCode ? `?$filter=ItemCode eq '${itemCode}'` : "";
    const response = await this.request("GET", `InventoryGenEntries${filter}`);
    return response.value || [];
  }

  /**
   * TEST CONNECTION
   */

  async testConnection(): Promise<boolean> {
    try {
      await this.login();
      await this.request("GET", "BusinessPartners?$top=1");
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default {
  NetSuiteConnector,
  SAPConnector,
};
