// AsaasService.ts

export interface AsaasCustomerData {
  name: string;
  email: string;
  externalReference: string;
  cpfCnpj?: string;
  phone?: string;
}

export interface AsaasPaymentData {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  externalReference: string;
  description?: string;
}

export interface AsaasSubscriptionData {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY';
  externalReference: string;
  description?: string;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[AsaasService] Enviando requisição para ${url} (Tentativa ${i + 1}/${retries})...`);
      const res = await fetch(url, options);
      // Retorna em caso de sucesso ou erro do cliente (4xx), que não precisa de retry
      if (res.ok || res.status < 500) {
        return res;
      }
      console.warn(`[AsaasService] Falha temporária no servidor Asaas. Status: ${res.status}.`);
    } catch (e: any) {
      console.error(`[AsaasService] Erro de rede na requisição: ${e.message}.`);
      if (i === retries - 1) throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return fetch(url, options);
}

export class AsaasService {
  private static getHeaders(apiKey: string) {
    return {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    };
  }

  static async createCustomer(apiKey: string, baseUrl: string, data: AsaasCustomerData) {
    if (!data.name || !data.email) {
      throw new Error('[AsaasService] Nome e Email são obrigatórios para cadastro de cliente.');
    }

    const url = `${baseUrl}/customers`;
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao criar cliente: ${text}`);
    }

    console.log('[AsaasService] Cliente criado com sucesso no Asaas.');
    return JSON.parse(text);
  }

  static async getCustomer(apiKey: string, baseUrl: string, customerId: string) {
    const url = `${baseUrl}/customers/${customerId}`;
    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: this.getHeaders(apiKey),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao obter cliente: ${text}`);
    }

    return JSON.parse(text);
  }

  static async createPixPayment(apiKey: string, baseUrl: string, data: AsaasPaymentData) {
    const url = `${baseUrl}/payments`;
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao criar cobrança PIX: ${text}`);
    }

    const payment = JSON.parse(text);

    // Buscar o Pix Copia e Cola e QR Code
    console.log(`[AsaasService] Buscando QR Code PIX para o pagamento ${payment.id}...`);
    const qrUrl = `${baseUrl}/payments/${payment.id}/pixQrCode`;
    const qrRes = await fetchWithRetry(qrUrl, {
      method: 'GET',
      headers: this.getHeaders(apiKey),
    });

    const qrText = await qrRes.text();
    let qrData = { payload: '', encodedImage: '' };
    if (qrRes.ok) {
      qrData = JSON.parse(qrText);
    } else {
      console.error(`[AsaasService] Erro ao buscar QR Code PIX: ${qrText}`);
    }

    return {
      payment,
      pixCopyPaste: qrData.payload,
      qrCode: qrData.encodedImage,
    };
  }

  static async createCreditCardPayment(apiKey: string, baseUrl: string, data: AsaasPaymentData) {
    const url = `${baseUrl}/payments`;
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao criar cobrança de Cartão: ${text}`);
    }

    return JSON.parse(text);
  }

  static async createSubscription(apiKey: string, baseUrl: string, data: AsaasSubscriptionData) {
    const url = `${baseUrl}/subscriptions`;
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao criar assinatura recorrente: ${text}`);
    }

    return JSON.parse(text);
  }

  static async cancelSubscription(apiKey: string, baseUrl: string, subscriptionId: string) {
    const url = `${baseUrl}/subscriptions/${subscriptionId}`;
    const res = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: this.getHeaders(apiKey),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao cancelar assinatura: ${text}`);
    }

    return JSON.parse(text);
  }

  static async getPayment(apiKey: string, baseUrl: string, paymentId: string) {
    const url = `${baseUrl}/payments/${paymentId}`;
    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: this.getHeaders(apiKey),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao obter pagamento: ${text}`);
    }

    return JSON.parse(text);
  }

  static async getSubscription(apiKey: string, baseUrl: string, subscriptionId: string) {
    const url = `${baseUrl}/subscriptions/${subscriptionId}`;
    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: this.getHeaders(apiKey),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[AsaasService] Erro ao obter assinatura: ${text}`);
    }

    return JSON.parse(text);
  }
}
