/**
 * ERP Integration Framework
 * 
 * Unified interface for major ERP systems:
 * - SAP
 * - Oracle NetSuite
 * - Microsoft Dynamics 365
 * - QuickBooks
 */

export interface ERPProduct {
  erpId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  quantity?: number;
  uom?: string; // Unit of measure
  category?: string;
  customFields?: Record<string, any>;
}

export interface ERPOrder {
  erpId: string;
  orderNumber: string;
  customerErpId: string;
  orderDate: Date;
  status: string;
  total: number;
  currency: string;
  lineItems: ERPOrderLine[];
  shippingAddress?: ERPAddress;
  billingAddress?: ERPAddress;
}

export interface ERPOrderLine {
  erpId: string;
  productErpId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ERPAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ERPCustomer {
  erpId: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: ERPAddress;
  shippingAddress?: ERPAddress;
  terms?: string;
  creditLimit?: number;
}

export interface ERPInventoryUpdate {
  sku: string;
  quantity: number;
  location?: string;
  transactionType: 'ADJUSTMENT' | 'RECEIPT' | 'SHIPMENT' | 'TRANSFER';
  reason?: string;
}

export interface ERPInvoice {
  erpId: string;
  invoiceNumber: string;
  customerErpId: string;
  invoiceDate: Date;
  dueDate: Date;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  lineItems: ERPInvoiceLine[];
}

export interface ERPInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Base ERP Connector Interface
 */
export interface IERPConnector {
  // Product/Item Management
  getProducts(lastModified?: Date): Promise<ERPProduct[]>;
  getProduct(erpId: string): Promise<ERPProduct>;
  updateProduct(erpId: string, product: Partial<ERPProduct>): Promise<ERPProduct>;
  
  // Order Management
  getOrders(startDate?: Date, endDate?: Date): Promise<ERPOrder[]>;
  getOrder(erpId: string): Promise<ERPOrder>;
  createOrder(order: Omit<ERPOrder, 'erpId'>): Promise<ERPOrder>;
  updateOrderStatus(erpId: string, status: string): Promise<ERPOrder>;
  
  // Customer Management
  getCustomers(lastModified?: Date): Promise<ERPCustomer[]>;
  getCustomer(erpId: string): Promise<ERPCustomer>;
  
  // Inventory Management
  updateInventory(update: ERPInventoryUpdate): Promise<void>;
  getInventoryLevel(sku: string, location?: string): Promise<number>;
  
  // Invoice Management
  createInvoice(invoice: Omit<ERPInvoice, 'erpId'>): Promise<ERPInvoice>;
  getInvoice(erpId: string): Promise<ERPInvoice>;
  
  // Connection Test
  testConnection(): Promise<boolean>;
}

/**
 * SAP Connector
 */
export class SAPConnector implements IERPConnector {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private token?: string;
  private tokenExpiry?: Date;

  constructor() {
    this.apiUrl = process.env.SAP_API_URL || '';
    this.clientId = process.env.SAP_CLIENT_ID || '';
    this.clientSecret = process.env.SAP_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const response = await fetch(`${this.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`SAP authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
    
    return this.token;
  }

  async getProducts(lastModified?: Date): Promise<ERPProduct[]> {
    const token = await this.getAccessToken();
    
    let url = `${this.apiUrl}/A_Product`;
    if (lastModified) {
      url += `?$filter=LastChangeDateTime gt datetime'${lastModified.toISOString()}'`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get products failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.d.results.map((item: any) => ({
      erpId: item.Product,
      sku: item.Product,
      name: item.ProductDescription,
      description: item.ProductLongText,
      price: parseFloat(item.NetPrice || 0),
      cost: parseFloat(item.StandardCost || 0),
      uom: item.BaseUnit,
      category: item.ProductGroup,
    }));
  }

  async getProduct(erpId: string): Promise<ERPProduct> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/A_Product('${erpId}')`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get product failed: ${response.statusText}`);
    }

    const item = await response.json();
    return {
      erpId: item.d.Product,
      sku: item.d.Product,
      name: item.d.ProductDescription,
      description: item.d.ProductLongText,
      price: parseFloat(item.d.NetPrice || 0),
      cost: parseFloat(item.d.StandardCost || 0),
      uom: item.d.BaseUnit,
      category: item.d.ProductGroup,
    };
  }

  async updateProduct(erpId: string, product: Partial<ERPProduct>): Promise<ERPProduct> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/A_Product('${erpId}')`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ProductDescription: product.name,
        ProductLongText: product.description,
        NetPrice: product.price?.toString(),
        StandardCost: product.cost?.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`SAP update product failed: ${response.statusText}`);
    }

    return this.getProduct(erpId);
  }

  async getOrders(startDate?: Date, endDate?: Date): Promise<ERPOrder[]> {
    const token = await this.getAccessToken();
    
    let url = `${this.apiUrl}/A_SalesOrder`;
    const filters: string[] = [];
    
    if (startDate) {
      filters.push(`SalesOrderDate ge datetime'${startDate.toISOString()}'`);
    }
    if (endDate) {
      filters.push(`SalesOrderDate le datetime'${endDate.toISOString()}'`);
    }
    
    if (filters.length > 0) {
      url += `?$filter=${filters.join(' and ')}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get orders failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.d.results.map((order: any) => ({
      erpId: order.SalesOrder,
      orderNumber: order.SalesOrder,
      customerErpId: order.SoldToParty,
      orderDate: new Date(order.SalesOrderDate),
      status: order.OverallSDProcessStatus,
      total: parseFloat(order.TotalNetAmount),
      currency: order.TransactionCurrency,
      lineItems: [],
    }));
  }

  async getOrder(erpId: string): Promise<ERPOrder> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/A_SalesOrder('${erpId}')?$expand=to_Item`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get order failed: ${response.statusText}`);
    }

    const data = await response.json();
    const order = data.d;

    return {
      erpId: order.SalesOrder,
      orderNumber: order.SalesOrder,
      customerErpId: order.SoldToParty,
      orderDate: new Date(order.SalesOrderDate),
      status: order.OverallSDProcessStatus,
      total: parseFloat(order.TotalNetAmount),
      currency: order.TransactionCurrency,
      lineItems: order.to_Item.results.map((line: any) => ({
        erpId: line.SalesOrderItem,
        productErpId: line.Material,
        sku: line.Material,
        quantity: parseFloat(line.OrderQuantity),
        unitPrice: parseFloat(line.NetAmount) / parseFloat(line.OrderQuantity),
        total: parseFloat(line.NetAmount),
      })),
    };
  }

  async createOrder(order: Omit<ERPOrder, 'erpId'>): Promise<ERPOrder> {
    throw new Error('SAP create order not yet implemented');
  }

  async updateOrderStatus(erpId: string, status: string): Promise<ERPOrder> {
    throw new Error('SAP update order status not yet implemented');
  }

  async getCustomers(lastModified?: Date): Promise<ERPCustomer[]> {
    const token = await this.getAccessToken();
    
    let url = `${this.apiUrl}/A_Customer`;
    if (lastModified) {
      url += `?$filter=LastChangeDateTime gt datetime'${lastModified.toISOString()}'`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get customers failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.d.results.map((customer: any) => ({
      erpId: customer.Customer,
      name: customer.CustomerName,
      email: customer.EmailAddress,
      phone: customer.PhoneNumber,
      creditLimit: parseFloat(customer.CreditLimitAmount || 0),
    }));
  }

  async getCustomer(erpId: string): Promise<ERPCustomer> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/A_Customer('${erpId}')`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get customer failed: ${response.statusText}`);
    }

    const customer = await response.json();
    return {
      erpId: customer.d.Customer,
      name: customer.d.CustomerName,
      email: customer.d.EmailAddress,
      phone: customer.d.PhoneNumber,
      creditLimit: parseFloat(customer.d.CreditLimitAmount || 0),
    };
  }

  async updateInventory(update: ERPInventoryUpdate): Promise<void> {
    throw new Error('SAP update inventory not yet implemented');
  }

  async getInventoryLevel(sku: string, location?: string): Promise<number> {
    const token = await this.getAccessToken();

    let url = `${this.apiUrl}/A_MaterialStock?$filter=Material eq '${sku}'`;
    if (location) {
      url += ` and Plant eq '${location}'`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SAP get inventory level failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.d.results.reduce((sum: number, stock: any) => {
      return sum + parseFloat(stock.MatlWrhsStkQtyInMatlBaseUnit || 0);
    }, 0);
  }

  async createInvoice(invoice: Omit<ERPInvoice, 'erpId'>): Promise<ERPInvoice> {
    throw new Error('SAP create invoice not yet implemented');
  }

  async getInvoice(erpId: string): Promise<ERPInvoice> {
    throw new Error('SAP get invoice not yet implemented');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('SAP connection test failed:', error);
      return false;
    }
  }
}

/**
 * NetSuite Connector
 */
export class NetSuiteConnector implements IERPConnector {
  private accountId: string;
  private consumerKey: string;
  private consumerSecret: string;
  private tokenId: string;
  private tokenSecret: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.NETSUITE_ACCOUNT_ID || '';
    this.consumerKey = process.env.NETSUITE_CONSUMER_KEY || '';
    this.consumerSecret = process.env.NETSUITE_CONSUMER_SECRET || '';
    this.tokenId = process.env.NETSUITE_TOKEN_ID || '';
    this.tokenSecret = process.env.NETSUITE_TOKEN_SECRET || '';
    this.baseUrl = `https://${this.accountId}.suitetalk.api.netsuite.com/services/rest`;
  }

  private generateAuthHeader(method: string, url: string): string {
    // OAuth 1.0a signature generation (simplified - use oauth-1.0a library in production)
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(7);
    
    return `OAuth realm="${this.accountId}", oauth_consumer_key="${this.consumerKey}", oauth_token="${this.tokenId}", oauth_signature_method="HMAC-SHA256", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_version="1.0"`;
  }

  async getProducts(lastModified?: Date): Promise<ERPProduct[]> {
    throw new Error('NetSuite get products not yet implemented');
  }

  async getProduct(erpId: string): Promise<ERPProduct> {
    throw new Error('NetSuite get product not yet implemented');
  }

  async updateProduct(erpId: string, product: Partial<ERPProduct>): Promise<ERPProduct> {
    throw new Error('NetSuite update product not yet implemented');
  }

  async getOrders(startDate?: Date, endDate?: Date): Promise<ERPOrder[]> {
    throw new Error('NetSuite get orders not yet implemented');
  }

  async getOrder(erpId: string): Promise<ERPOrder> {
    throw new Error('NetSuite get order not yet implemented');
  }

  async createOrder(order: Omit<ERPOrder, 'erpId'>): Promise<ERPOrder> {
    throw new Error('NetSuite create order not yet implemented');
  }

  async updateOrderStatus(erpId: string, status: string): Promise<ERPOrder> {
    throw new Error('NetSuite update order status not yet implemented');
  }

  async getCustomers(lastModified?: Date): Promise<ERPCustomer[]> {
    throw new Error('NetSuite get customers not yet implemented');
  }

  async getCustomer(erpId: string): Promise<ERPCustomer> {
    throw new Error('NetSuite get customer not yet implemented');
  }

  async updateInventory(update: ERPInventoryUpdate): Promise<void> {
    throw new Error('NetSuite update inventory not yet implemented');
  }

  async getInventoryLevel(sku: string, location?: string): Promise<number> {
    throw new Error('NetSuite get inventory level not yet implemented');
  }

  async createInvoice(invoice: Omit<ERPInvoice, 'erpId'>): Promise<ERPInvoice> {
    throw new Error('NetSuite create invoice not yet implemented');
  }

  async getInvoice(erpId: string): Promise<ERPInvoice> {
    throw new Error('NetSuite get invoice not yet implemented');
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test API connection
      return false; // Not implemented yet
    } catch (error) {
      console.error('NetSuite connection test failed:', error);
      return false;
    }
  }
}

/**
 * ERP Connector Factory
 */
export class ERPConnectorFactory {
  static create(erpSystem: string): IERPConnector {
    switch (erpSystem.toLowerCase()) {
      case 'sap':
        return new SAPConnector();
      case 'netsuite':
        return new NetSuiteConnector();
      default:
        throw new Error(`Unsupported ERP system: ${erpSystem}`);
    }
  }
}

// Export connector instances
export const sapConnector = new SAPConnector();
export const netsuiteConnector = new NetSuiteConnector();
